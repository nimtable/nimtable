/*
 * Copyright 2026 Nimtable
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package io.nimtable.db.repository;

import io.ebean.DB;
import io.nimtable.db.entity.Catalog;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CatalogRepository {

    private static final Logger LOG = LoggerFactory.getLogger(CatalogRepository.class);

    public List<Catalog> findAll() {
        return new ArrayList<>(DB.find(Catalog.class).orderBy().asc("name").findList());
    }

    public Catalog save(Catalog catalog) {
        DB.save(catalog);
        return catalog;
    }

    public Catalog findByName(String name) {
        return DB.find(Catalog.class).where().eq("name", name).findOne();
    }

    public void delete(Catalog catalog) {
        DB.delete(catalog);
    }

    // Add other methods like findById, delete etc. if needed
}
