#[macro_use]
extern crate rocket;

use reqwest;
use rocket::http::Method;
use rocket::http::Status;
use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

// Struct to represent the catalog configuration
#[derive(Debug, Serialize, Deserialize)]
struct Catalog {
    name: String,
    url: String,
}

// Struct to represent the entire config file
#[derive(Debug, Deserialize)]
struct Config {
    catalogs: Vec<Catalog>,
}

// Add this new struct for error responses
#[derive(Debug, Serialize)]
struct ErrorResponse {
    message: String,
}

// API endpoint to list catalogs
#[get("/api/catalogs")]
fn list_catalogs() -> Json<Vec<Catalog>> {
    // Read and parse the config file
    let config_contents = fs::read_to_string("config.yaml").expect("Failed to read config file");

    let config: Config =
        serde_yaml::from_str(&config_contents).expect("Failed to parse config file");

    Json(config.catalogs)
}

#[get("/api/catalog/<catalog>/<path..>")]
async fn proxy_catalog(method: Method, catalog: &str, path: PathBuf) -> Result<String, Status> {
    // Read config file
    let config_contents = fs::read_to_string("config.yaml").expect("Failed to read config file");
    let config: Config =
        serde_yaml::from_str(&config_contents).expect("Failed to parse config file");

    // Find the catalog with matching name
    let catalog = config
        .catalogs
        .iter()
        .find(|c| c.name == catalog)
        .ok_or(Status::NotFound)?;

    // Construct the target URL
    let target_url = format!("{}{}", catalog.url, path.to_string_lossy());

    // Make the HTTP request with the same method as the incoming request
    let client = reqwest::Client::new();
    let response = match method {
        rocket::http::Method::Get => client.get(&target_url),
        rocket::http::Method::Post => client.post(&target_url),
        rocket::http::Method::Put => client.put(&target_url),
        rocket::http::Method::Delete => client.delete(&target_url),
        rocket::http::Method::Head => client.head(&target_url),
        rocket::http::Method::Options => client.request(reqwest::Method::OPTIONS, &target_url),
        rocket::http::Method::Patch => client.patch(&target_url),
        _ => return Err(Status::NotImplemented),
    }
    .send()
    .await
    .map_err(|_| Status::InternalServerError)?;

    // Get the response body as text
    let body = response
        .text()
        .await
        .map_err(|_| Status::InternalServerError)?;

    Ok(body)
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![list_catalogs, proxy_catalog])
}
