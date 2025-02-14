#[macro_use]
extern crate rocket;

mod proxy;

use proxy::ProxyHandler;

use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};
use std::fs;

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

// API endpoint to list catalogs
#[get("/api/catalogs")]
fn list_catalogs() -> Json<Vec<Catalog>> {
    // Read and parse the config file
    let config_contents = fs::read_to_string("config.yaml").expect("Failed to read config file");

    let config: Config =
        serde_yaml::from_str(&config_contents).expect("Failed to parse config file");

    Json(config.catalogs)
}

#[launch]
fn rocket() -> _ {
    let config_contents = fs::read_to_string("config.yaml").expect("Failed to read config file");
    let config: Config =
        serde_yaml::from_str(&config_contents).expect("Failed to parse config file");

    let mut rocket = rocket::build().mount("/", routes![list_catalogs]);

    // Mount a proxy handler for each catalog
    for catalog in config.catalogs {
        let source_base = format!("/api/catalog/{}", catalog.name);
        let handler = ProxyHandler::new(source_base.clone(), catalog.url);
        rocket = rocket.mount(&source_base, handler);
    }

    rocket
}
