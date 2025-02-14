use reqwest;
use rocket::http::Method;
use rocket::{
    data::Data,
    http::Status,
    request::Request,
    response::Response,
    route::{Handler, Outcome, Route},
};

#[derive(Clone)]
pub struct ProxyHandler {
    source_base: String,
    target_base: String,
}

impl ProxyHandler {
    pub fn new(source_base: String, target_base: String) -> Self {
        Self {
            source_base,
            target_base,
        }
    }
}

#[rocket::async_trait]
impl Handler for ProxyHandler {
    async fn handle<'r>(&self, req: &'r Request<'_>, _data: Data<'r>) -> Outcome<'r> {
        // Extract the path by removing source_base from the URI
        let path = req.uri().path().as_str();
        let relative_path = path.strip_prefix(&self.source_base).unwrap_or(path);

        // Construct target URL
        let target_url = format!("{}{}", self.target_base, relative_path);

        // Create reqwest client and forward the request
        let client = reqwest::Client::new();
        let response = match req.method() {
            Method::Get => client.get(&target_url),
            Method::Post => client.post(&target_url),
            Method::Put => client.put(&target_url),
            Method::Delete => client.delete(&target_url),
            Method::Head => client.head(&target_url),
            Method::Options => client.request(reqwest::Method::OPTIONS, &target_url),
            Method::Patch => client.patch(&target_url),
            _ => return Outcome::Error(Status::NotImplemented),
        }
        .send()
        .await;

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
