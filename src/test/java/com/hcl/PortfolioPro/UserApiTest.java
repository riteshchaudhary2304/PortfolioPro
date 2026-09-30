package com.hcl.PortfolioPro;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.hcl.PortfolioPro.controller.AuthController;
import com.hcl.PortfolioPro.model.User;
import com.hcl.PortfolioPro.repository.UserRepository;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserApiTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthController authController;

    @Test
    void signupPersistsPasswordHashAndStartsSession() {
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(7L);
            return user;
        });
        MockHttpServletRequest request = new MockHttpServletRequest();

        var response = authController.signup(
                new AuthController.Credentials("Alice", "Password123!"), request);
        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("alice", response.getBody().username());
        assertEquals(7L, request.getSession(false).getAttribute(AuthController.SESSION_USER_ID));
        verify(userRepository).save(savedUser.capture());
        assertFalse(savedUser.getValue().getPasswordHash().equals("Password123!"));
        assertTrue(new BCryptPasswordEncoder().matches("Password123!", savedUser.getValue().getPasswordHash()));
    }
}