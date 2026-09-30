import { useEffect, useState } from 'react';
import axios from 'axios';
import './TradingTerminal.css';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true,
});

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});
const indexNumber = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const marketIndices = [
  { name: 'NIFTY 50', value: 24850.5, exchange: 'NSE' },
  { name: 'SENSEX', value: 81300.75, exchange: 'BSE' },
];

function getErrorMessage(error, fallback) {
  return error.response?.data?.detail || error.response?.data?.message || fallback;
}

function App() {
  const [account, setAccount] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dashboardBusy, setDashboardBusy] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [tradeError, setTradeError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('market');
  const [trade, setTrade] = useState({ symbol: '', quantity: '1', type: 'BUY' });

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        const response = await api.get('/auth/me');
        if (active) setAccount(response.data);
      } catch {
        if (active) setAccount(false);
      } finally {
        if (active) setAuthChecked(true);
      }
    };
    restoreSession();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!account?.id) return undefined;
    let active = true;
    const loadDashboard = async () => {
      setDashboardBusy(true);
      setDashboardError('');
      try {
        const [stockResponse, transactionResponse] = await Promise.all([
          api.get('/stocks'),
          api.get('/trade/portfolio'),
        ]);
        if (active) {
          setStocks(stockResponse.data);
          setTransactions(transactionResponse.data);
          if (stockResponse.data.length) {
            setTrade(current => current.symbol ? current : ({ ...current, symbol: stockResponse.data[0].symbol }));
          }
        }
      } catch (error) {
        if (active) setDashboardError(getErrorMessage(error, 'Could not load your portfolio data.'));
      } finally {
        if (active) setDashboardBusy(false);
      }
    };
    loadDashboard();
    return () => { active = false; };
  }, [account?.id]);

  const positions = transactions.reduce((result, transaction) => {
    const position = result[transaction.symbol] || { quantity: 0, cost: 0 };
    const quantity = Number(transaction.quantity);
    if (transaction.type === 'BUY') {
      position.quantity += quantity;
      position.cost += quantity * Number(transaction.executionPrice || 0);
    } else {
      position.quantity -= quantity;
      position.cost -= quantity * Number(transaction.executionPrice || 0);
    }
    result[transaction.symbol] = position;
    return result;
  }, {});
  const heldPositions = Object.entries(positions)
    .filter(([, position]) => position.quantity > 0)
    .map(([symbol, position]) => ({
      symbol,
      quantity: position.quantity,
      averageCost: position.cost / position.quantity,
      stock: stocks.find(stock => stock.symbol === symbol),
    }));
  const portfolioValue = heldPositions.reduce(
    (sum, position) => sum + position.quantity * Number(position.stock?.currentPrice || 0),
    0,
  );

  const handleAuth = async event => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    try {
      const response = await api.post(`/auth/${authMode}`, credentials);
      setAccount(response.data);
      setCredentials({ username: '', password: '' });
      setActiveTab('market');
    } catch (error) {
      setAuthError(getErrorMessage(error, 'Could not sign in. Check the backend and try again.'));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccount(false);
      setStocks([]);
      setTransactions([]);
      setNotice('');
    }
  };

  const handleTrade = async event => {
    event.preventDefault();
    setTradeError('');
    setNotice('');
    try {
      const response = await api.post('/trade', {
        symbol: trade.symbol,
        quantity: Number(trade.quantity),
        type: trade.type,
      });
      setTransactions(current => [response.data, ...current]);
      setTrade(current => ({ ...current, quantity: '1' }));
      setNotice(`${response.data.type} order recorded for ${response.data.quantity} ${response.data.symbol} share${response.data.quantity === 1 ? '' : 's'}.`);
      setActiveTab('orders');
    } catch (error) {
      setTradeError(getErrorMessage(error, 'The order could not be completed.'));
    }
  };

  if (!authChecked) {
    return <main className="boot-screen"><div className="boot-mark">PP</div><span>Connecting to PortfolioPro</span></main>;
  }

  if (!account) {
    const signingUp = authMode === 'signup';
    return (
      <main className="auth-screen">
        <section className="auth-visual">
          <div className="auth-brand"><span className="brand-mark">P</span> PORTFOLIO<span>PRO</span></div>
          <div className="auth-copy">
            <p className="eyebrow">A CLEARER VIEW OF YOUR MARKET</p>
            <h1>Build your position.<br />Know where you stand.</h1>
            <p>Track demo-priced stocks, place buy and sell orders, and keep your transaction history in one place.</p>
          </div>
          <div className="auth-footnote">Quotes are simulated for demonstration.</div>
        </section>
        <section className="auth-panel">
          <div className="auth-form-wrap">
            <p className="eyebrow">PORTFOLIO ACCOUNT</p>
            <h2>{signingUp ? 'Create your account' : 'Welcome back'}</h2>
            <p className="muted">{signingUp ? 'Your portfolio is saved to the connected database.' : 'Sign in to continue to your portfolio.'}</p>
            <form className="auth-form" onSubmit={handleAuth}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                autoComplete="username"
                minLength="3"
                maxLength="30"
                value={credentials.username}
                onChange={event => setCredentials({ ...credentials, username: event.target.value })}
                required
              />
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete={signingUp ? 'new-password' : 'current-password'}
                minLength={signingUp ? 8 : undefined}
                maxLength="64"
                value={credentials.password}
                onChange={event => setCredentials({ ...credentials, password: event.target.value })}
                required
              />
              {signingUp && <span className="field-hint">Use at least 8 characters.</span>}
              {authError && <p className="inline-error" role="alert">{authError}</p>}
              <button className="button button-primary auth-submit" disabled={authBusy}>
                {authBusy ? 'Please wait...' : signingUp ? 'Create account' : 'Sign in'}
              </button>
            </form>
            <p className="auth-switch">
              {signingUp ? 'Already have an account?' : 'New to PortfolioPro?'}{' '}
              <button type="button" onClick={() => { setAuthMode(signingUp ? 'login' : 'signup'); setAuthError(''); }}>
                {signingUp ? 'Sign in' : 'Create account'}
              </button>
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="terminal-shell">
      <header className="topbar">
        <a className="wordmark" href="#market" onClick={() => setActiveTab('market')}>
          <span className="brand-mark">P</span><span>Portfolio<span className="wordmark-light">Pro</span></span>
        </a>
        <nav className="main-nav" aria-label="Portfolio sections">
          {[
            ['market', 'Market'],
            ['holdings', 'Holdings'],
            ['orders', 'Orders'],
          ].map(([tab, label]) => (
            <button key={tab} className={activeTab === tab ? 'nav-link active' : 'nav-link'} onClick={() => setActiveTab(tab)}>{label}</button>
          ))}
        </nav>
        <div className="account-actions">
          <span className="account-name"><span className="account-dot" />{account.username}</span>
          <button className="logout-button" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main className="workspace">
        <section className="page-heading">
          <div>
            <p className="eyebrow">YOUR INVESTING WORKSPACE</p>
            <h1>{activeTab === 'market' ? 'Market overview' : activeTab === 'holdings' ? 'Your holdings' : 'Order history'}</h1>
          </div>
          <span className="quote-status"><span /> Demo quotes</span>
        </section>

        <section className="indices-strip" aria-label="Indian market indices">
          <div className="indices-label"><p className="eyebrow">INDIAN MARKET</p><span>Demo index levels</span></div>
          {marketIndices.map(index => (
            <div className="index-value" key={index.name}>
              <span>{index.name}<small>{index.exchange}</small></span>
              <strong>{indexNumber.format(index.value)}</strong>
            </div>
          ))}
        </section>

        {dashboardError && <div className="notice notice-error" role="alert">{dashboardError}</div>}
        {notice && <div className="notice notice-success" role="status">{notice}</div>}

        <section className="summary-strip" aria-label="Portfolio summary">
          <div className="summary-item"><span>Portfolio value</span><strong>{money.format(portfolioValue)}</strong><small>Based on available demo quotes</small></div>
          <div className="summary-item"><span>Open positions</span><strong>{heldPositions.length}</strong><small>Stocks with shares owned</small></div>
          <div className="summary-item"><span>Transactions</span><strong>{transactions.length}</strong><small>Saved to your account</small></div>
        </section>

        {activeTab === 'market' && (
          <section className="market-layout">
            <div className="data-section">
              <div className="section-heading">
                <div><p className="eyebrow">AVAILABLE INSTRUMENTS</p><h2>Market watch</h2></div>
                <span className="row-count">{stocks.length} stocks</span>
              </div>
              <div className="table-wrap">
                <table className="market-table">
                  <thead><tr><th>Instrument</th><th>Symbol</th><th>Demo price</th><th aria-label="Trade action" /></tr></thead>
                  <tbody>
                    {stocks.map(stock => (
                      <tr key={stock.id}>
                        <td><strong>{stock.name}</strong><small>Equity</small></td>
                        <td><span className="symbol-tag">{stock.symbol}</span></td>
                        <td className="price-cell">{money.format(stock.currentPrice)}</td>
                        <td><button className="text-action" onClick={() => { setTrade(current => ({ ...current, symbol: stock.symbol, type: 'BUY' })); setTradeError(''); }}>Trade <span aria-hidden="true">-&gt;</span></button></td>
                      </tr>
                    ))}
                    {!stocks.length && <tr><td colSpan="4" className="empty-state">{dashboardBusy ? 'Loading instruments...' : 'No stocks are available.'}</td></tr>}
                  </tbody>
                </table>
              </div>
              <p className="data-note">Prices are seeded demo values and are not live market data.</p>
            </div>

            <aside className="order-panel">
              <div className="section-heading order-heading"><div><p className="eyebrow">PLACE A TRADE</p><h2>New order</h2></div></div>
              <div className="trade-toggle" role="group" aria-label="Order type">
                {['BUY', 'SELL'].map(type => (
                  <button key={type} className={trade.type === type ? `trade-option ${type.toLowerCase()} selected` : 'trade-option'} onClick={() => { setTrade({ ...trade, type }); setTradeError(''); }}>{type}</button>
                ))}
              </div>
              <form className="trade-form" onSubmit={handleTrade}>
                <label htmlFor="stock-symbol">Stock</label>
                <select id="stock-symbol" value={trade.symbol} onChange={event => setTrade({ ...trade, symbol: event.target.value })} required>
                  {!stocks.length && <option value="">No stocks available</option>}
                  {stocks.map(stock => <option key={stock.id} value={stock.symbol}>{stock.symbol} - {stock.name}</option>)}
                </select>
                <label htmlFor="quantity">Quantity</label>
                <input id="quantity" type="number" min="1" step="1" value={trade.quantity} onChange={event => setTrade({ ...trade, quantity: event.target.value })} required />
                {trade.symbol && stocks.find(stock => stock.symbol === trade.symbol) && (
                  <div className="order-estimate"><span>Estimated order value</span><strong>{money.format(Number(stocks.find(stock => stock.symbol === trade.symbol).currentPrice) * Number(trade.quantity || 0))}</strong></div>
                )}
                {tradeError && <p className="inline-error" role="alert">{tradeError}</p>}
                <button className={trade.type === 'BUY' ? 'button button-primary' : 'button button-sell'} disabled={!stocks.length || !trade.quantity}>
                  Submit {trade.type.toLowerCase()} order
                </button>
              </form>
              <p className="order-caption">Orders use the displayed demo price and are saved in your transaction history.</p>
            </aside>
          </section>
        )}

        {activeTab === 'holdings' && (
          <section className="data-section full-section">
            <div className="section-heading"><div><p className="eyebrow">POSITIONS FROM YOUR TRADE HISTORY</p><h2>Holdings</h2></div></div>
            <div className="table-wrap">
              <table className="market-table">
                <thead><tr><th>Instrument</th><th>Shares</th><th>Average cost</th><th>Last demo price</th><th>Market value</th></tr></thead>
                <tbody>
                  {heldPositions.map(position => (
                    <tr key={position.symbol}>
                      <td><strong>{position.stock?.name || position.symbol}</strong><small>{position.symbol}</small></td>
                      <td>{position.quantity}</td>
                      <td>{money.format(position.averageCost)}</td>
                      <td>{position.stock ? money.format(position.stock.currentPrice) : 'N/A'}</td>
                      <td className="price-cell">{money.format(position.quantity * Number(position.stock?.currentPrice || 0))}</td>
                    </tr>
                  ))}
                  {!heldPositions.length && <tr><td colSpan="5" className="empty-state">{dashboardBusy ? 'Loading holdings...' : 'No open positions yet. Buy a stock from Market to get started.'}</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'orders' && (
          <section className="data-section full-section">
            <div className="section-heading"><div><p className="eyebrow">ACCOUNT ACTIVITY</p><h2>Transactions</h2></div><span className="row-count">{transactions.length} records</span></div>
            <div className="table-wrap">
              <table className="market-table">
                <thead><tr><th>Side</th><th>Instrument</th><th>Quantity</th><th>Execution price</th><th>Total</th><th>Time</th></tr></thead>
                <tbody>
                  {transactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td><span className={`side-tag ${transaction.type.toLowerCase()}`}>{transaction.type}</span></td>
                      <td><strong>{transaction.symbol}</strong></td>
                      <td>{transaction.quantity}</td>
                      <td>{money.format(transaction.executionPrice || 0)}</td>
                      <td>{money.format(Number(transaction.quantity) * Number(transaction.executionPrice || 0))}</td>
                      <td className="time-cell">{new Date(transaction.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                  {!transactions.length && <tr><td colSpan="6" className="empty-state">{dashboardBusy ? 'Loading transactions...' : 'Your completed orders will appear here.'}</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}
        <footer className="workspace-footer"><span>PortfolioPro</span><span>Demo trading workspace · Quotes are not real-time</span></footer>
      </main>
    </div>
  );
}

export default App;
