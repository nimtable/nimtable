#[macro_use]
extern crate rocket;

mod config;
mod proxy;

use clap::{arg, command, Parser};
use config::{Catalog, Config};
use proxy::ProxyHandler;

use rocket::serde::json::Json;

// Command line arguments
#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Path to the config file
    #[arg(short, long, default_value = "config.yaml")]
    config: String,
}

#[get("/api/catalogs")]
fn list_catalogs(config: &rocket::State<Config>) -> Json<Vec<Catalog>> {
    Json(config.catalogs.clone())
}

#[rocket::main]
async fn main() {
    let args = Args::parse();
    let config = Config::read_from_file(args.config).expect("Failed to read config file");

    let mut rocket = rocket::build()
        .manage(config.clone())
        .mount("/", routes![list_catalogs]);

    // Mount a proxy handler for each catalog
    for catalog in config.catalogs {
        let source_base = format!("/api/catalog/{}", catalog.name);
        let handler = ProxyHandler::new(source_base.clone(), catalog.url);
        rocket = rocket.mount(&source_base, handler);
    }

    let _ = rocket.launch().await;
}
