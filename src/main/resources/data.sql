UPDATE stocks SET symbol = 'RELIANCE', name = 'Reliance Industries Ltd', current_price = 1250.00 WHERE symbol = 'AAPL';
UPDATE stocks SET symbol = 'TCS', name = 'Tata Consultancy Services Ltd', current_price = 3400.00 WHERE symbol = 'TSLA';
UPDATE stocks SET symbol = 'INFY', name = 'Infosys Ltd', current_price = 1600.00 WHERE symbol = 'MSFT';
UPDATE stocks SET symbol = 'HDFCBANK', name = 'HDFC Bank Ltd', current_price = 1720.00 WHERE symbol = 'AMZN';

INSERT INTO stocks (symbol, name, current_price)
SELECT 'RELIANCE', 'Reliance Industries Ltd', 1250.00
WHERE NOT EXISTS (SELECT 1 FROM stocks WHERE symbol = 'RELIANCE');
INSERT INTO stocks (symbol, name, current_price)
SELECT 'TCS', 'Tata Consultancy Services Ltd', 3400.00
WHERE NOT EXISTS (SELECT 1 FROM stocks WHERE symbol = 'TCS');
INSERT INTO stocks (symbol, name, current_price)
SELECT 'INFY', 'Infosys Ltd', 1600.00
WHERE NOT EXISTS (SELECT 1 FROM stocks WHERE symbol = 'INFY');
INSERT INTO stocks (symbol, name, current_price)
SELECT 'HDFCBANK', 'HDFC Bank Ltd', 1720.00
WHERE NOT EXISTS (SELECT 1 FROM stocks WHERE symbol = 'HDFCBANK');
INSERT INTO stocks (symbol, name, current_price)
SELECT 'ICICIBANK', 'ICICI Bank Ltd', 1250.00
WHERE NOT EXISTS (SELECT 1 FROM stocks WHERE symbol = 'ICICIBANK');
INSERT INTO stocks (symbol, name, current_price)
SELECT 'SBIN', 'State Bank of India', 825.00
WHERE NOT EXISTS (SELECT 1 FROM stocks WHERE symbol = 'SBIN');
INSERT INTO stocks (symbol, name, current_price)
SELECT 'ITC', 'ITC Ltd', 430.00
WHERE NOT EXISTS (SELECT 1 FROM stocks WHERE symbol = 'ITC');
INSERT INTO stocks (symbol, name, current_price)
SELECT 'LT', 'Larsen & Toubro Ltd', 3500.00
WHERE NOT EXISTS (SELECT 1 FROM stocks WHERE symbol = 'LT');