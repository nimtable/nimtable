#[macro_use]
extern crate rocket;

mod config;
mod proxy;

use clap::{arg, command, Parser};
use config::{Catalog, Config};
use proxy::ProxyHandler;

use rocket::serde::json::Json;
use std::fs;

// Command line arguments
#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Path to the config file
    #[arg(short, long, default_value = "config.yaml")]
    config: String,
}

// Update API endpoint to use managed state
#[get("/api/catalogs")]
fn list_catalogs(config: &rocket::State<Config>) -> Json<Vec<Catalog>> {
    Json(config.catalogs.clone())
}

#[launch]
fn rocket() -> _ {
    // Parse command line arguments
    let args = Args::parse();
    let config_path = args.config;

    // Read and parse the config file
    let config_contents = fs::read_to_string(&config_path).expect("Failed to read config file");
    let config: Config =
        serde_yaml::from_str(&config_contents).expect("Failed to parse config file");

    let mut rocket = rocket::build()
        .manage(config.clone()) // Add config as managed state
        .mount("/", routes![list_catalogs]);

    // Mount a proxy handler for each catalog
    for catalog in config.catalogs {
        let source_base = format!("/api/catalog/{}", catalog.name);
        let handler = ProxyHandler::new(source_base.clone(), catalog.url);
        rocket = rocket.mount(&source_base, handler);
    }

    rocket
}
