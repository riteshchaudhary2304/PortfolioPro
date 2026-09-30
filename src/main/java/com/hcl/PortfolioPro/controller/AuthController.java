package com.hcl.PortfolioPro.controller;

import com.hcl.PortfolioPro.model.User;
import com.hcl.PortfolioPro.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {
    public static final String SESSION_USER_ID = "portfolioUserId";

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody Credentials credentials, HttpServletRequest request) {
        String username = credentials.username().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That username is already registered.");
        }

        User user = userRepository.save(new User(username, username, passwordEncoder.encode(credentials.password())));
        return ResponseEntity.status(HttpStatus.CREATED).body(startSession(user, request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody Credentials credentials, HttpServletRequest request) {
        String username = credentials.username().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByUsername(username);
        if (user == null || !passwordEncoder.matches(credentials.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Username or password is incorrect.");
        }
        return startSession(user, request);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> currentUser(HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (!(userId instanceof Long id)) {
            return ResponseEntity.noContent().build();
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in to continue."));
        return ResponseEntity.ok(response(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.noContent().build();
    }

    private AuthResponse startSession(User user, HttpServletRequest request) {
        HttpSession existingSession = request.getSession(false);
        if (existingSession != null) {
            existingSession.invalidate();
        }
        request.getSession(true).setAttribute(SESSION_USER_ID, user.getId());
        return response(user);
    }

    private AuthResponse response(User user) {
        return new AuthResponse(user.getId(), user.getUsername(), user.getName());
    }

    public record Credentials(
            @NotBlank @Size(min = 3, max = 30) @Pattern(regexp = "[A-Za-z0-9_.-]+") String username,
            @NotBlank @Size(min = 8, max = 64) String password) {
    }

    public record AuthResponse(Long id, String username, String name) {
    }
}