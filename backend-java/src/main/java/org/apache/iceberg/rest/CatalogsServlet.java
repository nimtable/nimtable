package org.apache.iceberg.rest;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

public class CatalogsServlet extends HttpServlet {
    private final Config config;
    private final ObjectMapper mapper;

    public CatalogsServlet(Config config) {
        this.config = config;
        this.mapper = new ObjectMapper();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        List<String> catalogs = config.getCatalogs().stream()
                .map(Config.Catalog::getName)
                .collect(Collectors.toList());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        mapper.writeValue(response.getOutputStream(), catalogs);
    }
}
