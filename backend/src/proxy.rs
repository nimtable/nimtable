use log::info;
use reqwest;
use rocket::http::Method;
use rocket::{
    data::{Data, ToByteUnit},
    http::Status,
    request::Request,
    response::Response,
    route::{Handler, Outcome, Route},
};

#[derive(Clone)]
pub struct ProxyHandler {
    source_base: String,
    target_base: String,

    /// The prefix in the [Iceberg REST Catalog API](https://raw.githubusercontent.com/apache/iceberg/refs/heads/main/open-api/rest-catalog-open-api.yaml)
    prefix: Option<String>,
}

impl ProxyHandler {
    pub fn new(source_base: String, target_base: String, prefix: Option<String>) -> Self {
        Self {
            source_base,
            target_base,
            prefix,
        }
    }
}

#[rocket::async_trait]
impl Handler for ProxyHandler {
    async fn handle<'r>(&self, req: &'r Request<'_>, data: Data<'r>) -> Outcome<'r> {
        // Extract the path by removing source_base from the URI
        let path = req.uri().path().as_str();
        let relative_path = path.strip_prefix(&self.source_base).unwrap_or(path);

        // Construct target URL
        let target_url = if relative_path == "/v1/config" || self.prefix.is_none() {
            // Only the `config` API is not prefixed by the catalog name
            format!("{}{}", self.target_base, relative_path)
        } else {
            // The other APIs are prefixed by the catalog name
            let path = relative_path.strip_prefix("/v1/").unwrap_or(relative_path);
            let prefix = self.prefix.clone().unwrap_or("".to_string());
            format!("{}/v1/{}/{}", self.target_base, prefix, path)
        };

        info!(
            "proxying {} {} to {}",
            req.method(),
            req.uri().path(),
            target_url
        );

        // Create reqwest client and forward the request
        let client = reqwest::Client::new();
        let mut request_builder = match req.method() {
            Method::Get => client.get(&target_url),
            Method::Post => client.post(&target_url),
            Method::Put => client.put(&target_url),
            Method::Delete => client.delete(&target_url),
            Method::Head => client.head(&target_url),
            Method::Options => client.request(reqwest::Method::OPTIONS, &target_url),
            Method::Patch => client.patch(&target_url),
            _ => return Outcome::Error(Status::NotImplemented),
        };

        // Copy headers from original request
        for header in req.headers().iter() {
            request_builder = request_builder.header(header.name.as_str(), header.value.as_ref());
        }

        // For methods that can have a body, read and forward the data
        let response = match req.method() {
            Method::Post | Method::Put | Method::Patch => {
                // Read the incoming request data with a reasonable size limit
                let limit = req.limits().get("data").unwrap_or(5.mebibytes());
                match data.open(limit).into_bytes().await {
                    Ok(bytes) if bytes.is_complete() => {
                        request_builder.body(bytes.into_inner()).send().await
                    }
                    Ok(_) => return Outcome::Error(Status::PayloadTooLarge),
                    Err(_) => return Outcome::Error(Status::InternalServerError),
                }
            }
            _ => request_builder.send().await,
        };

        // Handle the response
        match response {
            Ok(resp) => {
                let status = match Status::from_code(resp.status().as_u16()) {
                    Some(status) => status,
                    None => return Outcome::Error(Status::InternalServerError),
                };
                match resp.text().await {
                    Ok(body) => Outcome::Success(
                        Response::build()
                            .status(status)
                            .sized_body(body.len(), std::io::Cursor::new(body))
                            .finalize(),
                    ),
                    Err(_) => Outcome::Error(Status::InternalServerError),
                }
            }
            Err(_) => Outcome::Error(Status::BadGateway),
        }
    }
}

impl Into<Vec<Route>> for ProxyHandler {
    fn into(self) -> Vec<Route> {
        // Create routes for all common HTTP methods
        vec![
            Route::new(Method::Get, "/<path..>", self.clone()),
            Route::new(Method::Post, "/<path..>", self.clone()),
            Route::new(Method::Put, "/<path..>", self.clone()),
            Route::new(Method::Delete, "/<path..>", self.clone()),
            Route::new(Method::Head, "/<path..>", self.clone()),
            Route::new(Method::Options, "/<path..>", self.clone()),
            Route::new(Method::Patch, "/<path..>", self),
        ]
    }
}
