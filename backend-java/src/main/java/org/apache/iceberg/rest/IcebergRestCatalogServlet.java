package org.apache.iceberg.rest;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.UncheckedIOException;
import java.util.*;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.hc.core5.http.ContentType;
import org.apache.iceberg.exceptions.RESTException;
import org.apache.iceberg.relocated.com.google.common.collect.ImmutableMap;
import org.apache.iceberg.relocated.com.google.common.io.CharStreams;
import org.apache.iceberg.rest.RESTCatalogAdapter.HTTPMethod;
import org.apache.iceberg.rest.RESTCatalogAdapter.Route;
import org.apache.iceberg.rest.responses.ErrorResponse;
import org.apache.iceberg.util.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class IcebergRestCatalogServlet extends HttpServlet {
    private static final Logger LOG = LoggerFactory.getLogger(RESTCatalogServlet.class);
    private final RESTCatalogAdapter restCatalogAdapter;
    private final Map<String, String> responseHeaders;

    public IcebergRestCatalogServlet(RESTCatalogAdapter restCatalogAdapter) {
        this.responseHeaders = ImmutableMap.of("Content-Type", ContentType.APPLICATION_JSON.getMimeType());
        this.restCatalogAdapter = restCatalogAdapter;
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        this.execute(IcebergRestCatalogServlet.ServletRequestContext.from(request), response);
    }

    protected void doHead(HttpServletRequest request, HttpServletResponse response) throws IOException {
        this.execute(IcebergRestCatalogServlet.ServletRequestContext.from(request), response);
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        this.execute(IcebergRestCatalogServlet.ServletRequestContext.from(request), response);
    }

    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        this.execute(IcebergRestCatalogServlet.ServletRequestContext.from(request), response);
    }

    protected void execute(ServletRequestContext context, HttpServletResponse response) throws IOException {
        response.setStatus(200);
        Objects.requireNonNull(response);
        this.responseHeaders.forEach(response::setHeader);
        if (context.error().isPresent()) {
            response.setStatus(400);
            RESTObjectMapper.mapper().writeValue(response.getWriter(), context.error().get());
        } else {
            try {
                Object responseBody = this.restCatalogAdapter.execute(context.method(), context.path(), context.queryParams(), context.body(), context.route().responseClass(), context.headers(), this.handle(response));
                if (responseBody != null) {
                    RESTObjectMapper.mapper().writeValue(response.getWriter(), responseBody);
                }
            } catch (RESTException var4) {
                LOG.error("Error processing REST request", var4);
                response.setStatus(500);
            } catch (Exception var5) {
                LOG.error("Unexpected exception when processing REST request", var5);
                response.setStatus(500);
            }

        }
    }

    protected Consumer<ErrorResponse> handle(HttpServletResponse response) {
        return (errorResponse) -> {
            response.setStatus(errorResponse.code());

            try {
                RESTObjectMapper.mapper().writeValue(response.getWriter(), errorResponse);
            } catch (IOException var3) {
                throw new UncheckedIOException(var3);
            }
        };
    }

    public static class ServletRequestContext {
        private RESTCatalogAdapter.HTTPMethod method;
        private RESTCatalogAdapter.Route route;
        private String path;
        private Map<String, String> headers;
        private Map<String, String> queryParams;
        private Object body;
        private ErrorResponse errorResponse;

        private ServletRequestContext(ErrorResponse errorResponse) {
            this.errorResponse = errorResponse;
        }

        private ServletRequestContext(RESTCatalogAdapter.HTTPMethod method, RESTCatalogAdapter.Route route, String path, Map<String, String> headers, Map<String, String> queryParams, Object body) {
            this.method = method;
            this.route = route;
            this.path = path;
            this.headers = headers;
            this.queryParams = queryParams;
            this.body = body;
        }

        static ServletRequestContext from(HttpServletRequest request) throws IOException {
            RESTCatalogAdapter.HTTPMethod method = HTTPMethod.valueOf(request.getMethod());
            String path = Arrays.stream(request.getRequestURI()
                            .split("/")).skip(4) // Note(eric): hack happens here
                    .collect(Collectors.joining("/"));
            LOG.debug("PATH is "  + path);
            Pair<RESTCatalogAdapter.Route, Map<String, String>> routeContext = Route.from(method, path);
            if (routeContext == null) {
                return new ServletRequestContext(ErrorResponse.builder().responseCode(400).withType("BadRequestException").withMessage(String.format("No route for request: %s %s", method, path)).build());
            } else {
                RESTCatalogAdapter.Route route = routeContext.first();
                Object requestBody = null;
                if (route.requestClass() != null) {
                    requestBody = RESTObjectMapper.mapper().readValue(request.getReader(), route.requestClass());
                } else if (route == Route.TOKENS) {
                    Reader reader = new InputStreamReader(request.getInputStream());
                    Throwable var7 = null;

                    try {
                        requestBody = RESTUtil.decodeFormData(CharStreams.toString(reader));
                    } catch (Throwable var16) {
                        var7 = var16;
                        throw var16;
                    } finally {
                        if (var7 != null) {
                            try {
                                reader.close();
                            } catch (Throwable var15) {
                                var7.addSuppressed(var15);
                            }
                        } else {
                            reader.close();
                        }

                    }
                }

                Map<String, String> queryParams = request.getParameterMap()
                        .entrySet().stream()
                        .collect(Collectors.toMap(Map.Entry::getKey,
                                (e) -> ((String[])e.getValue())[0]));
                Stream<String> var10000 = Collections.list(request.getHeaderNames()).stream();
                Function<Object, Object> var10001 = Function.identity();
                Objects.requireNonNull(request);
                Map<String, String> headers = (Map)var10000.collect(Collectors.toMap(var10001, request::getHeader));
                return new ServletRequestContext(method, route, path, headers, queryParams, requestBody);
            }
        }

        public RESTCatalogAdapter.HTTPMethod method() {
            return this.method;
        }

        public RESTCatalogAdapter.Route route() {
            return this.route;
        }

        public String path() {
            return this.path;
        }

        public Map<String, String> headers() {
            return this.headers;
        }

        public Map<String, String> queryParams() {
            return this.queryParams;
        }

        public Object body() {
            return this.body;
        }

        public Optional<ErrorResponse> error() {
            return Optional.ofNullable(this.errorResponse);
        }
    }
}

