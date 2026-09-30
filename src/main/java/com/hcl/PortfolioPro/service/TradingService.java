package com.hcl.PortfolioPro.service;


import com.hcl.PortfolioPro.model.Stock;
import com.hcl.PortfolioPro.model.Transaction;
import com.hcl.PortfolioPro.model.User;
import com.hcl.PortfolioPro.repository.StockRepository;
import com.hcl.PortfolioPro.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class TradingService {
    private final StockRepository stockRepository;
    private final TransactionRepository transactionRepository;

    public TradingService(StockRepository stockRepository, TransactionRepository transactionRepository) {
        this.stockRepository = stockRepository;
        this.transactionRepository = transactionRepository;
    }

    public List<Stock> getAllStocks() { return stockRepository.findAll(); }

    @Transactional
    public Transaction executeTrade(String symbol, int quantity, String type, User user) {
        String normalizedSymbol = symbol.trim().toUpperCase();
        String normalizedType = type.trim().toUpperCase();
        if (quantity <= 0 || (!normalizedType.equals("BUY") && !normalizedType.equals("SELL"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a positive quantity and choose BUY or SELL.");
        }

        Stock stock = stockRepository.findBySymbol(normalizedSymbol);
        if (stock == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "That stock is not available to trade.");
        }

        List<Transaction> userTransactions = transactionRepository.findByUser_IdOrderByTimestampDesc(user.getId());
        int heldShares = userTransactions.stream()
            .filter(existing -> normalizedSymbol.equals(existing.getSymbol()))
                .filter(existing -> existing.getType() != null)
                .mapToInt(existing -> {
                    Integer existingQuantity = existing.getQuantity();
                    if (existingQuantity == null) {
                        return 0;
                    }
                    return existing.getType().equals("BUY") ? existingQuantity : -existingQuantity;
                })
                .sum();
        if (normalizedType.equals("SELL") && quantity > heldShares) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot sell more shares than you own.");
        }

        Transaction transaction = new Transaction();
        transaction.setSymbol(normalizedSymbol);
        transaction.setQuantity(quantity);
        transaction.setType(normalizedType);
        transaction.setExecutionPrice(stock.getCurrentPrice());
        transaction.setUser(user);
        return transactionRepository.save(transaction);
    }

    public List<Transaction> getTransactions(User user) {
        return transactionRepository.findByUser_IdOrderByTimestampDesc(user.getId());
    }
}