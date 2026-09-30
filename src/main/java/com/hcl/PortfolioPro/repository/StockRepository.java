package com.hcl.PortfolioPro.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hcl.PortfolioPro.model.Stock;

public interface StockRepository extends JpaRepository<Stock, Long> {
    Stock findBySymbol(String symbol);
}