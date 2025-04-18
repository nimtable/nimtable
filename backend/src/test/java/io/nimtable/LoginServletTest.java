package io.nimtable;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.nimtable.db.entity.User;
import io.nimtable.db.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.*;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mindrot.jbcrypt.BCrypt;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class) // Initialize mocks
class LoginServletTest {

    // Mocks for dependencies
    @Mock private UserRepository userRepository;
    @Mock private Config config;
    @Mock private Config.Auth configAuth; // Mock the inner record too
    @Mock private HttpServletRequest request;
    @Mock private HttpServletResponse response;
    @Mock private BufferedReader reader;
    @Mock private PrintWriter writer; // Mock the writer

    @InjectMocks // Inject mocks into the servlet instance
    private LoginServlet loginServlet;

    @Captor // Capture arguments passed to mocks
    private ArgumentCaptor<String> stringCaptor;
    @Captor private ArgumentCaptor<Integer> intCaptor;

    private final ObjectMapper objectMapper = new ObjectMapper(); // Real ObjectMapper

    @BeforeEach // Setup mocks before each test
    void setUp() throws IOException {
        // Common setup: Mock request to return a reader, and response to return a
        // writer
        when(request.getReader()).thenReturn(reader);
        when(response.getWriter()).thenReturn(writer);
        // Assume response isn't committed initially
        when(response.isCommitted()).thenReturn(false);
    }

    private void mockRequestJson(String json) throws IOException {
        when(reader.readLine()).thenReturn(json, null); // Simulate reading the JSON line
    }

    @Test
    void testSuccessfulLogin_DatabaseUser() throws IOException {
        // Arrange: Prepare test data and mock behavior
        String username = "dbuser";
        String password = "password123";
        String hashedPassword = BCrypt.hashpw(password, BCrypt.gensalt());
        User dbUser = new User();
        dbUser.setUsername(username);
        dbUser.setPasswordHash(hashedPassword);

        // Mock request body
        ObjectNode requestJson = objectMapper.createObjectNode();
        requestJson.put("username", username);
        requestJson.put("password", password);
        mockRequestJson(requestJson.toString());

        // Mock UserRepository response
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(dbUser));

        // Act: Call the servlet method
        loginServlet.doPost(request, response);

        // Assert: Verify the response
        verify(response).setStatus(HttpServletResponse.SC_OK);
        verify(writer).write(stringCaptor.capture()); // Capture the JSON response

        // Parse the captured JSON and check its content
        ObjectNode responseJson = (ObjectNode) objectMapper.readTree(stringCaptor.getValue());
        assert responseJson.path("success").asBoolean();
        // Ensure config auth wasn't checked unnecessarily
        verify(config, never()).auth();
    }

    @Test
    void testFailedLogin_DatabaseUser_WrongPassword() throws IOException {
        // Arrange
        String username = "dbuser";
        String password = "wrongpassword";
        String correctPassword = "password123";
        String hashedPassword = BCrypt.hashpw(correctPassword, BCrypt.gensalt());
        User dbUser = new User();
        dbUser.setUsername(username);
        dbUser.setPasswordHash(hashedPassword);

        ObjectNode requestJson = objectMapper.createObjectNode();
        requestJson.put("username", username);
        requestJson.put("password", password);
        mockRequestJson(requestJson.toString());

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(dbUser));
        // Mock config user as different to ensure fallback is checked
        when(config.auth()).thenReturn(configAuth);
        when(configAuth.username()).thenReturn("configadmin");
        when(configAuth.password()).thenReturn("configpass");

        // Act
        loginServlet.doPost(request, response);

        // Assert
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(writer).write(stringCaptor.capture());
        ObjectNode responseJson = (ObjectNode) objectMapper.readTree(stringCaptor.getValue());
        assert !responseJson.path("success").asBoolean();
        assert responseJson.path("message").asText().equals("Invalid username or password");
        // Verify config was checked as fallback
        verify(config, times(1)).auth();
    }

    @Test
    void testSuccessfulLogin_ConfigUser() throws IOException {
        // Arrange
        String username = "configadmin";
        String password = "configpassword";

        ObjectNode requestJson = objectMapper.createObjectNode();
        requestJson.put("username", username);
        requestJson.put("password", password);
        mockRequestJson(requestJson.toString());

        // Mock UserRepository: user not found in DB
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());
        // Mock Config user details
        when(config.auth()).thenReturn(configAuth);
        when(configAuth.username()).thenReturn(username);
        when(configAuth.password()).thenReturn(password);

        // Act
        loginServlet.doPost(request, response);

        // Assert
        verify(response).setStatus(HttpServletResponse.SC_OK);
        verify(writer).write(stringCaptor.capture());
        ObjectNode responseJson = (ObjectNode) objectMapper.readTree(stringCaptor.getValue());
        assert responseJson.path("success").asBoolean();
        // Verify DB was checked first
        verify(userRepository, times(1)).findByUsername(username);
        // Verify config was checked as fallback
        verify(config, times(1)).auth();
    }

    @Test
    void testFailedLogin_NotFoundInDbOrConfig() throws IOException {
        // Arrange
        String username = "unknownuser";
        String password = "somepassword";

        ObjectNode requestJson = objectMapper.createObjectNode();
        requestJson.put("username", username);
        requestJson.put("password", password);
        mockRequestJson(requestJson.toString());

        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());
        // Mock config user as different
        when(config.auth()).thenReturn(configAuth);
        when(configAuth.username()).thenReturn("configadmin");
        when(configAuth.password()).thenReturn("configpass");

        // Act
        loginServlet.doPost(request, response);

        // Assert
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(writer).write(stringCaptor.capture());
        ObjectNode responseJson = (ObjectNode) objectMapper.readTree(stringCaptor.getValue());
        assert !responseJson.path("success").asBoolean();
        assert responseJson.path("message").asText().equals("Invalid username or password");
        // Verify both were checked
        verify(userRepository, times(1)).findByUsername(username);
        verify(config, times(1)).auth();
    }

    @Test
    void testFailedLogin_DbUserWrongPw_ConfigUserWrongPw() throws IOException {
        // Arrange: DB user exists, but wrong password provided. Config user also
        // doesn't match.
        String username = "dbuser";
        String wrongPassword = "wrongpassword";
        String correctDbPassword = "dbpassword";
        String hashedDbPassword = BCrypt.hashpw(correctDbPassword, BCrypt.gensalt());
        User dbUser = new User();
        dbUser.setUsername(username);
        dbUser.setPasswordHash(hashedDbPassword);

        ObjectNode requestJson = objectMapper.createObjectNode();
        requestJson.put("username", username);
        requestJson.put("password", wrongPassword);
        mockRequestJson(requestJson.toString());

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(dbUser));
        // Mock config user as different
        when(config.auth()).thenReturn(configAuth);
        when(configAuth.username()).thenReturn("configadmin");
        when(configAuth.password()).thenReturn("configpass");

        // Act
        loginServlet.doPost(request, response);

        // Assert
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(writer).write(stringCaptor.capture());
        ObjectNode responseJson = (ObjectNode) objectMapper.readTree(stringCaptor.getValue());
        assert !responseJson.path("success").asBoolean();
        assert responseJson.path("message").asText().equals("Invalid username or password");
        // Verify both were checked
        verify(userRepository, times(1)).findByUsername(username);
        verify(config, times(1)).auth();
    }

    @Test
    void testFailedLogin_EmptyCredentials() throws IOException {
        // Arrange
        ObjectNode requestJson = objectMapper.createObjectNode();
        requestJson.put("username", ""); // Empty username
        requestJson.put("password", "somepassword");
        mockRequestJson(requestJson.toString());

        // Act
        loginServlet.doPost(request, response);

        // Assert
        verify(response).setStatus(HttpServletResponse.SC_BAD_REQUEST);
        verify(writer).write(stringCaptor.capture());
        ObjectNode responseJson = (ObjectNode) objectMapper.readTree(stringCaptor.getValue());
        assert !responseJson.path("success").asBoolean();
        assert responseJson
                .path("message")
                .asText()
                .equals("Username and password cannot be empty");
        // Ensure DB and config weren't checked
        verify(userRepository, never()).findByUsername(anyString());
        verify(config, never()).auth();
    }

    @Test
    void testFailedLogin_InvalidJson() throws IOException {
        // Arrange: Simulate reading invalid JSON
        when(reader.readLine()).thenThrow(new IOException("Simulated JSON parsing error"));
        // We don't need to provide actual invalid JSON string here, just make readLine
        // throw

        // Act
        loginServlet.doPost(request, response);

        // Assert
        verify(response).setStatus(HttpServletResponse.SC_BAD_REQUEST);
        verify(writer).write(stringCaptor.capture());
        ObjectNode responseJson = (ObjectNode) objectMapper.readTree(stringCaptor.getValue());
        assert !responseJson.path("success").asBoolean();
        assert responseJson.path("message").asText().equals("Invalid request format");
        // Ensure DB and config weren't checked
        verify(userRepository, never()).findByUsername(anyString());
        verify(config, never()).auth();
    }
}
