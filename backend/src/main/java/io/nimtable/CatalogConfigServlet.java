package io.nimtable;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;

public class CatalogConfigServlet extends HttpServlet {
    private final Config config;
    private final ObjectMapper mapper;

    public CatalogConfigServlet(Config config) {
        this.config = config;
        this.mapper = new ObjectMapper();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Catalog name is required");
            return;
        }

        String catalogName = pathInfo.substring(1); // Remove leading slash
        Config.Catalog catalog = config.catalogs().stream()
                .filter(c -> c.name().equals(catalogName))
                .findFirst()
                .orElse(null);

        if (catalog == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "Catalog not found: " + catalogName);
            return;
        }

        Map<String, String> catalogConfig = catalog.properties();
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        mapper.writeValue(response.getOutputStream(), catalogConfig);
    }
}