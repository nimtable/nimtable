use serde::{Deserialize, Serialize};

// Struct to represent the catalog configuration
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Catalog {
    /// Just an identifier
    pub name: String,
    /// The URL of the catalog
    pub url: String,
}

// Struct to represent the entire config file
#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    pub catalogs: Vec<Catalog>,
}
