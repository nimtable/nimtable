use std::path::Path;

use serde::{Deserialize, Serialize};

/// Iceberg catalog configuration.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Catalog {
    /// Just an identifier
    pub name: String,

    /// The base URL of the catalog. Should be of the form `{scheme}://{host}[:{port}]/{basePath}`
    ///
    /// See more at [Apache Iceberg REST Catalog API](https://raw.githubusercontent.com/apache/iceberg/refs/heads/main/open-api/rest-catalog-open-api.yaml).
    pub url: String,

    /// This prefix will be used in the API path as defined in the spec.
    ///
    /// See more at [Apache Iceberg REST Catalog API](https://raw.githubusercontent.com/apache/iceberg/refs/heads/main/open-api/rest-catalog-open-api.yaml).
    #[serde(default)]
    pub prefix: Option<String>,
}

// Struct to represent the entire config file
#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    pub catalogs: Vec<Catalog>,
}

impl Config {
    pub fn read_from_file<P: AsRef<Path>>(path: P) -> anyhow::Result<Self> {
        let config_contents = std::fs::read_to_string(path)?;
        Ok(serde_yaml::from_str(&config_contents)?)
    }
}
