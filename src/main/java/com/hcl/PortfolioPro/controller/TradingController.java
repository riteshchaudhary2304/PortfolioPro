package com.hcl.PortfolioPro.controller;

import com.hcl.PortfolioPro.model.Transaction;
import com.hcl.PortfolioPro.model.User;
import com.hcl.PortfolioPro.repository.UserRepository;
import com.hcl.PortfolioPro.service.TradingService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/trade")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class TradingController {

    private final TradingService tradingService;
    private final UserRepository userRepository;

    public TradingController(TradingService tradingService, UserRepository userRepository) {
        this.tradingService = tradingService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public Transaction executeTrade(@Valid @RequestBody TradeRequest request, HttpSession session) {
        return tradingService.executeTrade(request.symbol(), request.quantity(), request.type(), requireUser(session));
    }

    @GetMapping("/portfolio")
    public List<Transaction> getPortfolio(HttpSession session) {
        return tradingService.getTransactions(requireUser(session));
    }

    private User requireUser(HttpSession session) {
        Object userId = session.getAttribute(AuthController.SESSION_USER_ID);
        if (!(userId instanceof Long id)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in to continue.");
        }
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in to continue."));
    }

    public record TradeRequest(
            @NotBlank @Pattern(regexp = "[A-Za-z0-9.-]{1,12}") String symbol,
            @Min(1) int quantity,
            @NotBlank @Pattern(regexp = "(?i)BUY|SELL") String type) {
    }
}