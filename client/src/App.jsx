import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, Check,
  Clock3, Coffee, Heart, Leaf, MapPin, Menu, Minus, Plus, Search, ShieldCheck,
  ShoppingBag, Sparkles, Star, Truck, UserRound, X,
} from "lucide-react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api } from "./api.js";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import { CartProvider, useCart } from "./CartContext.jsx";
import { fallbackCategories, fallbackFoods, formatPrice, imageUrl } from "./data.js";

function SiteHeader({ onCart, onAuth, search, setSearch }) {
  const { user, signOut } = useAuth();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="QuickBite home">
          <span className="brand-mark"><img src="/images/quickbite-mark.svg" alt="" /></span>
          <span>quick<span className="brand-accent">bite</span><small>GOOD FOOD, GOOD MOOD</small></span>
        </Link>
        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`}>
          <a href="/#menu" onClick={() => setMenuOpen(false)}>Our menu</a>
          <a href="/#why-us" onClick={() => setMenuOpen(false)}>Our promise</a>
          {user && <Link to="/orders" onClick={() => setMenuOpen(false)}>My orders</Link>}
          {user?.role === "admin" && <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>}
        </nav>
        <div className="header-actions">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu"><Menu size={20} /></button>
          {user ? (
            <div className="user-menu">
              <span className="user-greeting"><UserRound size={16} /> Hi, {user.fullName.split(" ")[0]}</span>
              <button className="text-button" onClick={() => signOut().catch((error) => window.alert(error.message))}>Sign out</button>
            </div>
          ) : (
            <button className="sign-in-button" onClick={onAuth}><UserRound size={17} /> Sign in</button>
          )}
          <button className="cart-button" onClick={onCart} aria-label={`Open bag, ${count} ${count === 1 ? "item" : "items"}`}>
            <ShoppingBag size={18} /><span className="cart-label">Your bag</span>
            <span className="cart-count">{count}</span>
          </button>
        </div>
      </div>
      <div className="header-search">
        <Search size={17} />
        <input aria-label="Search menu" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="What are you craving today?" />
        <span className="search-shortcut">FRESHLY MADE · ALWAYS</span>
      </div>
    </header>
  );
}

function FoodCard({ food, onAdd, quantity, onChangeQuantity }) {
  const [favorite, setFavorite] = useState(false);
  return (
    <article className="food-card">
      <div className="food-image-wrap">
        <img className="food-image" src={imageUrl(food.imageName)} alt={food.title} loading="lazy" />
        {food.featured && <span className="food-tag"><Sparkles size={12} /> House favorite</span>}
        <button className={`favorite-button ${favorite ? "is-favorite" : ""}`} aria-label={`${favorite ? "Remove" : "Save"} ${food.title} ${favorite ? "from" : "to"} favorites`} aria-pressed={favorite} onClick={() => setFavorite(!favorite)}><Heart size={17} fill={favorite ? "currentColor" : "none"} /></button>
      </div>
      <div className="food-card-content">
        <div className="food-card-heading">
          <div><p className="food-category">{food.categoryTitle}</p><h3>{food.title}</h3></div>
          <strong>{formatPrice(food.price)}</strong>
        </div>
        <p className="food-description">{food.description}</p>
        <div className="food-card-bottom">
          <span className="rating"><Star size={14} fill="currentColor" /> 4.9 <i>·</i> Popular</span>
          {quantity > 0 ? (
            <div className="quantity-control card-quantity-control" aria-label={`${food.title} quantity`}>
              <button aria-label={`Remove one ${food.title}`} onClick={() => onChangeQuantity(food.id, -1)}><Minus size={13} /></button>
              <span aria-live="polite">{quantity}</span>
              <button aria-label={`Add one ${food.title}`} onClick={() => onChangeQuantity(food.id, 1)}><Plus size={13} /></button>
            </div>
          ) : (
            <button className="add-button" onClick={() => onAdd(food)}><Plus size={16} /> Add</button>
          )}
        </div>
      </div>
    </article>
  );
}

function Storefront({ categories, foods, onAuth }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [toast, setToast] = useState("");
  const { items, add, changeQuantity } = useCart();
  const filteredFoods = useMemo(
    () => activeCategory === "All" ? foods : foods.filter((food) => food.categoryTitle === activeCategory),
    [activeCategory, foods],
  );
  const addToCart = (food) => {
    add(food);
    setToast(`${food.title} added to your bag`);
    window.setTimeout(() => setToast(""), 2200);
  };

  return (
    <>
      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> MADE WITH A LITTLE MORE LOVE</div>
            <h1>Good food.<br /><em>Good mood.</em><br />Great days.</h1>
            <p>Thoughtful ingredients, familiar favorites, and a little joy in every bite. Your next feel-good meal is just around the corner.</p>
            <div className="hero-actions">
              <a className="primary-button" href="#menu">Explore the menu <ArrowDown size={17} /></a>
              <span className="delivery-note"><Truck size={17} /> At your door in 30–40 min</span>
            </div>
            <div className="hero-social-proof">
              <div className="avatar-stack"><span>J</span><span>M</span><span>A</span><span>+</span></div>
              <div><div className="hero-stars"><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><b>4.9</b></div><small>Loved by 2,000+ happy eaters</small></div>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-blob" />
            <img className="hero-food" src="/images/food/Food_Name_2340.jfif" alt="Freshly baked Margherita pizza" />
            <div className="floating-note note-rating"><span className="note-icon"><Star size={17} fill="currentColor" /></span><span><b>4.9 / 5</b><small>from our food lovers</small></span></div>
            <div className="floating-note note-delivery"><span className="note-icon green"><Clock3 size={17} /></span><span><b>Fresh, not fast-ish</b><small>made just for you</small></span></div>
            <span className="hero-sprinkle sprinkle-one">✳</span><span className="hero-sprinkle sprinkle-two">✦</span>
          </div>
          <div className="hero-bottom-tag"><span>01</span> YOUR LITTLE MOMENT OF DELICIOUS</div>
        </section>

        <section className="category-section section-shell">
          <div className="section-heading">
            <div><p className="eyebrow">A LITTLE SOMETHING FOR EVERYONE</p><h2>Find your <em>happy place.</em></h2></div>
            <a className="quiet-link" href="#menu">View full menu <ArrowRight size={16} /></a>
          </div>
          <div className="category-grid">
            {categories.map((category, index) => (
              <button key={category.id} className={`category-card category-tone-${index % 6}`} onClick={() => { setActiveCategory(category.title); document.querySelector("#menu")?.scrollIntoView({ behavior: "smooth" }); }}>
                <span className="category-image"><img src={imageUrl(category.imageName)} alt="" loading="lazy" /></span>
                <span className="category-text"><b>{category.title}</b><small>{category.description || "Made to make your day"}</small></span>
                <ArrowUpRight className="category-arrow" size={17} />
              </button>
            ))}
          </div>
        </section>

        <section className="menu-section section-shell" id="menu">
          <div className="section-heading menu-heading">
            <div><p className="eyebrow">THE GOOD STUFF</p><h2>Made fresh. <em>Made for you.</em></h2><p className="section-subtitle">A few of the favorites everyone keeps coming back for.</p></div>
            <div className="menu-decoration"><Leaf size={17} /> Good ingredients, happier plates</div>
          </div>
          <div className="filter-row">
            {["All", ...categories.map((category) => category.title)].map((name) => (
              <button key={name} onClick={() => setActiveCategory(name)} className={`filter-chip ${activeCategory === name ? "selected" : ""}`}>{name}</button>
            ))}
          </div>
          {filteredFoods.length ? (
            <div className="food-grid">{filteredFoods.map((food) => <FoodCard key={food.id} food={food} onAdd={addToCart} quantity={items.find((item) => item.id === food.id)?.quantity ?? 0} onChangeQuantity={changeQuantity} />)}</div>
          ) : (
            <div className="empty-state"><Search size={25} /><h3>No bites found just yet</h3><p>Try a different search or pick another category.</p></div>
          )}
          <div className="menu-footnote"><span><BadgeCheck size={16} /> Freshly prepared when you order</span><span>Prices include all taxes</span></div>
        </section>

        <section className="promise-section section-shell" id="why-us">
          <div className="promise-intro"><p className="eyebrow">A PROMISE, NOT A PITCH</p><h2>We believe the best meals feel like <em>coming home.</em></h2><p>So we keep things simple: ingredients we believe in, recipes made with care, and service that feels like a friend.</p><a className="quiet-link" href="#menu">Come see for yourself <ArrowRight size={16} /></a></div>
          <div className="promise-cards">
            <article><span className="promise-icon coral"><Leaf size={21} /></span><p className="promise-count">01 / GOODNESS</p><h3>Real ingredients</h3><p>Fresh produce, honest flavors, and no shortcuts on the things that matter.</p></article>
            <article><span className="promise-icon sage"><Clock3 size={21} /></span><p className="promise-count">02 / MADE FOR YOU</p><h3>Made to order</h3><p>Your food is cooked fresh after you order. No sitting around, ever.</p></article>
            <article><span className="promise-icon butter"><Heart size={21} /></span><p className="promise-count">03 / A LITTLE JOY</p><h3>Care in every detail</h3><p>From the first hello to the last bite, we want your day to feel a bit brighter.</p></article>
          </div>
        </section>

        <section className="newsletter-section section-shell">
          <div className="newsletter-mark"><Coffee size={25} /></div><div><p className="eyebrow">A GOOD THING IN YOUR INBOX</p><h2>Fresh updates, zero spam.</h2><p>New dishes, little surprises, and the occasional excuse to treat yourself.</p></div><form onSubmit={(event) => { event.preventDefault(); window.alert("Thanks for joining the QuickBite list!"); }}><label className="visually-hidden" htmlFor="newsletter-email">Your email address</label><input id="newsletter-email" type="email" placeholder="Your email address" required /><button className="primary-button" type="submit">Count me in <ArrowRight size={16} /></button></form>
        </section>
      </main>
      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
      <SiteFooter onAuth={onAuth} />
    </>
  );
}

function SiteFooter({ onAuth }) {
  return <footer className="site-footer"><div className="footer-main"><Link className="brand footer-brand" to="/"><span className="brand-mark"><img src="/images/quickbite-mark.svg" alt="" /></span><span>quick<span className="brand-accent">bite</span><small>GOOD FOOD, GOOD MOOD</small></span></Link><p>Good food is one of life's simplest joys.<br />We're here to make it a little easier.</p><div className="footer-links"><a href="#menu">Menu</a><a href="#why-us">Our promise</a><button onClick={onAuth}>Get in touch</button></div><div className="footer-contact"><span><MapPin size={15} /> Made with love, wherever you are</span><span><ShieldCheck size={15} /> Your details stay yours</span></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} QuickBite. Made for the love of food.</span><span>Good food. Good mood. Always.</span></div></footer>;
}

function AuthModal({ onClose }) {
  const { signIn, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form.entries());
    try {
      if (isRegister) await signUp({ fullName: data.fullName, email: data.email, password: data.password, phone: data.phone });
      else await signIn({ email: data.email, password: data.password });
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="auth-modal"><button className="modal-close" onClick={onClose} aria-label="Close sign in"><X size={20} /></button><div className="auth-modal-brand"><span className="brand-mark"><img src="/images/quickbite-mark.svg" alt="" /></span></div><p className="eyebrow">YOUR NEXT GOOD MEAL IS WAITING</p><h2>{isRegister ? "Let's get you started." : "Welcome back."}</h2><p className="auth-subtitle">{isRegister ? "Create an account to make your next order a breeze." : "Sign in to pick up right where the good stuff starts."}</p>
    <form className="auth-form" onSubmit={handleSubmit}>
      {isRegister && <label>Your name<input name="fullName" autoComplete="name" minLength="2" maxLength="100" required placeholder="Jamie Example" /></label>}
      <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
      {isRegister && <label>Phone number <span className="optional">(optional)</span><input name="phone" type="tel" maxLength="30" autoComplete="tel" placeholder="+91 98765 43210" /></label>}
      <label>Password<input name="password" type="password" minLength={isRegister ? 8 : 1} maxLength="72" autoComplete={isRegister ? "new-password" : "current-password"} required placeholder={isRegister ? "At least 8 characters" : "Your password"} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button auth-submit" disabled={busy}>{busy ? "One moment..." : isRegister ? "Create my account" : "Sign in"} <ArrowRight size={17} /></button>
    </form>
    <p className="auth-switch">{isRegister ? "Already have an account?" : "New to QuickBite?"} <button onClick={() => { setIsRegister(!isRegister); setError(""); }}>{isRegister ? "Sign in" : "Create an account"}</button></p>
  </section></div>;
}

function CartDrawer({ onClose, onAuth }) {
  const { items, total, changeQuantity, clear } = useCart();
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [checkout, setCheckout] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submitOrder = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/orders", {
        method: "POST",
        body: JSON.stringify({ items: items.map((item) => ({ foodId: item.id, quantity: item.quantity })), phone, address }),
      });
      clear();
      onClose();
      navigate("/orders");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };
  return <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="cart-drawer" aria-label="Shopping bag">
    <div className="drawer-heading"><div><p className="eyebrow">THE GOOD STUFF</p><h2>Your bag <span>({items.length})</span></h2></div><button className="icon-button" onClick={onClose} aria-label="Close bag"><X size={20} /></button></div>
    {!items.length ? <div className="cart-empty"><span><ShoppingBag size={27} /></span><h3>A little room for something lovely.</h3><p>Your bag is taking a breather. Add a favorite from the menu when you're ready.</p><button className="primary-button" onClick={onClose}>Explore the menu <ArrowRight size={16} /></button></div> : <>
      <div className="cart-items">{items.map((item) => <article className="cart-item" key={item.id}><img src={imageUrl(item.imageName)} alt="" /><div className="cart-item-info"><h3>{item.title}</h3><p>{formatPrice(item.price)}</p><div className="quantity-control"><button aria-label={`Remove one ${item.title}`} onClick={() => changeQuantity(item.id, -1)}><Minus size={13} /></button><span>{item.quantity}</span><button aria-label={`Add one ${item.title}`} onClick={() => changeQuantity(item.id, 1)}><Plus size={13} /></button></div></div><strong>{formatPrice(item.price * item.quantity)}</strong></article>)}</div>
      <div className="cart-summary"><div><span>Subtotal</span><b>{formatPrice(total)}</b></div><div><span>Delivery</span><b className="free-delivery">On us</b></div><div className="cart-total"><span>Total</span><b>{formatPrice(total)}</b></div><p><Truck size={15} /> Freshly prepared and delivered with care.</p>
        {!user ? <button className="primary-button checkout-button" onClick={() => { onClose(); onAuth(); }}>Sign in to checkout <ArrowRight size={16} /></button> : !checkout ? <button className="primary-button checkout-button" onClick={() => setCheckout(true)}>Continue to delivery <ArrowRight size={16} /></button> : <form className="checkout-form" onSubmit={submitOrder}><label>Phone number<input required minLength="5" maxLength="30" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" /></label><label>Delivery address<textarea required minLength="8" maxLength="500" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="House, street, city, and a helpful landmark" rows="3" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button checkout-button" disabled={busy}>{busy ? "Placing your order..." : "Place my order"} <ArrowRight size={16} /></button></form>}
      </div>
    </>}
  </aside></div>;
}

function OrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (user) api("/orders/mine").then(setOrders).catch((requestError) => setError(requestError.message));
  }, [user]);
  if (loading) return <div className="page-loading">Getting your good stuff ready...</div>;
  if (!user) return <SignInPrompt />;
  const cancel = async (id) => {
    try {
      await api(`/orders/${id}/cancel`, { method: "PATCH" });
      setOrders((current) => current.map((order) => order.id === id ? { ...order, status: "Cancelled" } : order));
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  return <main className="account-page section-shell"><p className="eyebrow">A LITTLE LOOK BACK</p><h1>Your orders, <em>{user.fullName.split(" ")[0]}.</em></h1><p className="section-subtitle">All your good meals, in one happy place.</p>{error && <p className="form-error">{error}</p>}
    {orders.length ? <div className="order-list">{orders.map((order) => <article className="order-card" key={order.id}><div className="order-card-top"><div><p className="food-category">ORDER #{order.id}</p><h3>{new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</h3></div><span className={`status-pill status-${order.status.toLowerCase().replaceAll(" ", "-")}`}>{order.status}</span></div><div className="order-items-list">{(typeof order.items === "string" ? JSON.parse(order.items) : order.items).map((item, index) => <span key={index}>{item.quantity} × {item.title}</span>)}</div><div className="order-card-bottom"><b>{formatPrice(order.total)}</b>{order.status === "Confirmed" && <button className="text-button cancel-order" onClick={() => cancel(order.id)}>Cancel order</button>}</div></article>)}</div> : <div className="empty-state orders-empty"><ShoppingBag size={28} /><h3>Your next favorite is waiting.</h3><p>You haven't placed an order yet. Let's fix that.</p><Link className="primary-button" to="/#menu">Find something lovely <ArrowRight size={16} /></Link></div>}
  </main>;
}

function SignInPrompt() {
  const [showAuth, setShowAuth] = useState(false);
  return <main className="account-page section-shell"><div className="empty-state orders-empty"><UserRound size={28} /><h3>Your orders are one sign-in away.</h3><p>Sign in to see order updates and all your past favorites.</p><button className="primary-button" onClick={() => setShowAuth(true)}>Sign in <ArrowRight size={16} /></button></div>{showAuth && <AuthModal onClose={() => setShowAuth(false)} />}</main>;
}

function AdminPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const refresh = async () => {
    const [stats, cats, menu, allOrders] = await Promise.all([
      api("/admin/summary"), api("/admin/categories"), api("/admin/foods"), api("/admin/orders"),
    ]);
    setSummary(stats); setCategories(cats); setFoods(menu); setOrders(allOrders);
  };
  useEffect(() => {
    if (user?.role === "admin") refresh().catch((requestError) => setError(requestError.message));
  }, [user]);
  if (loading) return <div className="page-loading">Opening your dashboard...</div>;
  if (!user || user.role !== "admin") return <SignInPrompt />;
  const submitFood = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      title: form.get("title"), description: form.get("description"), price: Number(form.get("price")),
      categoryId: Number(form.get("categoryId")), imageName: form.get("imageName"),
      featured: form.get("featured") === "on", active: true,
    };
    try { await api("/admin/foods", { method: "POST", body: JSON.stringify(payload) }); formElement.reset(); await refresh(); setMessage("New dish added to the menu."); }
    catch (requestError) { setError(requestError.message); }
  };
  const submitCategory = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      title: form.get("title"), description: form.get("description"),
      imageName: form.get("imageName"), featured: form.get("featured") === "on", active: true,
    };
    try { await api("/admin/categories", { method: "POST", body: JSON.stringify(payload) }); formElement.reset(); await refresh(); setMessage("New category added."); }
    catch (requestError) { setError(requestError.message); }
  };
  const toggleFood = async (food) => {
    try { await api(`/admin/foods/${food.id}`, { method: "PATCH", body: JSON.stringify({ active: !food.active }) }); await refresh(); }
    catch (requestError) { setError(requestError.message); }
  };
  const toggleCategory = async (category) => {
    try { await api(`/admin/categories/${category.id}`, { method: "PATCH", body: JSON.stringify({ active: !category.active }) }); await refresh(); }
    catch (requestError) { setError(requestError.message); }
  };
  const updateOrder = async (id, status) => {
    try { await api(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await refresh(); }
    catch (requestError) { setError(requestError.message); }
  };
  return <main className="admin-page section-shell"><div className="admin-heading"><div><p className="eyebrow">THE QUICKBITE CONTROL ROOM</p><h1>Good afternoon, <em>{user.fullName.split(" ")[0]}.</em></h1></div><span className="admin-badge"><ShieldCheck size={16} /> Admin workspace</span></div>
    <div className="admin-tabs">{["Overview", "Menu", "Orders"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
    {error && <p className="form-error admin-message">{error}</p>}{message && <p className="success-message admin-message"><Check size={16} /> {message}</p>}
    {tab === "Overview" && <>{summary && <div className="stats-grid"><article><span>Menu favorites</span><b>{summary.foodCount}</b><small>listed dishes</small></article><article><span>Categories</span><b>{summary.categoryCount}</b><small>ways to feel good</small></article><article><span>Orders</span><b>{summary.orderCount}</b><small>all-time orders</small></article><article><span>Delivered sales</span><b>{formatPrice(summary.revenue)}</b><small>completed orders</small></article></div>}<div className="admin-recent"><div className="admin-panel-heading"><div><p className="eyebrow">FRESH OFF THE PASS</p><h2>Recent orders</h2></div><button className="quiet-link" onClick={() => setTab("Orders")}>All orders <ArrowRight size={15} /></button></div><OrderTable orders={orders.slice(0, 5)} onStatus={updateOrder} /></div></>}
    {tab === "Menu" && <div className="admin-menu-layout"><section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">KEEP IT FRESH</p><h2>Add a new dish</h2></div></div><form className="admin-food-form" onSubmit={submitFood}><label>Dish name<input name="title" required minLength="2" maxLength="150" placeholder="e.g. Sunday morning pancakes" /></label><label>Description<textarea name="description" rows="3" maxLength="1000" placeholder="What makes it special?" /></label><div className="form-two-col"><label>Price (₹)<input name="price" type="number" min="1" step="0.01" required /></label><label>Category<select name="categoryId" required>{categories.filter((category) => category.active).map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select></label></div><label>Image path <span className="optional">(from /images)</span><input name="imageName" maxLength="255" placeholder="food/Food_Name_2340.jfif" /></label><label className="checkbox-label"><input name="featured" type="checkbox" /> Mark as a house favorite</label><button className="primary-button" type="submit">Add to menu <Plus size={16} /></button></form></section><section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">ON THE MENU</p><h2>All dishes <span className="light-count">{foods.length}</span></h2></div></div><div className="admin-food-list">{foods.map((food) => <article key={food.id} className={!food.active ? "is-inactive" : ""}><img src={imageUrl(food.imageName)} alt="" /><div><b>{food.title}</b><small>{food.categoryTitle} · {formatPrice(food.price)}</small></div><button className={`toggle-pill ${food.active ? "on" : ""}`} onClick={() => toggleFood(food)}>{food.active ? "Live" : "Hidden"}</button></article>)}</div></section><section className="admin-panel category-admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">MAKE ROOM FOR MORE</p><h2>Categories <span className="light-count">{categories.length}</span></h2></div></div><form className="admin-food-form" onSubmit={submitCategory}><label>Category name<input name="title" required minLength="2" maxLength="100" placeholder="e.g. Breakfast" /></label><label>Short description<input name="description" maxLength="500" placeholder="A little something to wake up for" /></label><label>Image path <span className="optional">(from /images)</span><input name="imageName" maxLength="255" placeholder="category/Food_category_107.jfif" /></label><button className="primary-button" type="submit">Add category <Plus size={16} /></button></form><div className="admin-food-list category-admin-list">{categories.map((category) => <article key={category.id} className={!category.active ? "is-inactive" : ""}><img src={imageUrl(category.imageName)} alt="" /><div><b>{category.title}</b><small>{category.active ? "Visible in the menu" : "Hidden from the menu"}</small></div><button className={`toggle-pill ${category.active ? "on" : ""}`} onClick={() => toggleCategory(category)}>{category.active ? "Live" : "Hidden"}</button></article>)}</div></section></div>}
    {tab === "Orders" && <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">EVERYTHING IN GOOD TIME</p><h2>Manage orders <span className="light-count">{orders.length}</span></h2></div></div><OrderTable orders={orders} onStatus={updateOrder} showCustomer /></section>}
  </main>;
}

function OrderTable({ orders, onStatus, showCustomer = false }) {
  if (!orders.length) return <p className="admin-no-orders">No orders just yet. They’ll show up here when they arrive.</p>;
  return <div className="admin-order-list">{orders.map((order) => <article key={order.id}><div className="admin-order-id"><b>#{order.id}</b><small>{new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</small></div>{showCustomer && <div className="admin-order-customer"><b>{order.customerName}</b><small>{order.customerEmail}</small></div>}<div className="admin-order-summary"><b>{(typeof order.items === "string" ? JSON.parse(order.items) : order.items).map((item) => `${item.quantity}× ${item.title}`).join(", ")}</b><small>{formatPrice(order.total)}</small></div><select aria-label={`Order ${order.id} status`} value={order.status} onChange={(event) => onStatus(order.id, event.target.value)}>{["Confirmed", "Preparing", "On the way", "Delivered", "Cancelled"].map((status) => <option key={status}>{status}</option>)}</select></article>)}</div>;
}

function AppShell() {
  const [categories, setCategories] = useState(fallbackCategories);
  const [foods, setFoods] = useState(fallbackFoods);
  const [search, setSearch] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [apiOffline, setApiOffline] = useState(false);
  const { user, loading } = useAuth();
  useEffect(() => {
    Promise.all([api("/categories"), api("/foods")])
      .then(([nextCategories, nextFoods]) => { setCategories(nextCategories); setFoods(nextFoods); })
      .catch(() => setApiOffline(true));
  }, []);
  const visibleFoods = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? foods.filter((food) => `${food.title} ${food.description} ${food.categoryTitle}`.toLowerCase().includes(query)) : foods;
  }, [foods, search]);

  return <div className="app-shell"><SiteHeader onCart={() => setShowCart(true)} onAuth={() => setShowAuth(true)} search={search} setSearch={setSearch} />
    {apiOffline && <div className="offline-banner"><span><span className="eyebrow-dot" /> PREVIEW MENU</span> Connect the MySQL database and API to enable accounts, ordering, and live menu updates.</div>}
    <Routes>
      <Route path="/" element={<Storefront categories={categories} foods={visibleFoods} onAuth={() => setShowAuth(true)} />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/admin" element={loading ? <div className="page-loading">Opening your dashboard...</div> : user?.role === "admin" ? <AdminPage /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    {showCart && <CartDrawer onClose={() => setShowCart(false)} onAuth={() => setShowAuth(true)} />}
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
  </div>;
}

export default function App() {
  return <AuthProvider><CartProvider><AppShell /></CartProvider></AuthProvider>;
}
