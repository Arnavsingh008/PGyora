
import { useEffect, useState } from "react";
import {
  Home, ArrowRight, Search, MapPin, ShieldCheck,
  Sparkles, BedDouble, Star, CheckCircle2, LogOut,
  Menu, X, CalendarDays, Wrench,
  LayoutDashboard, Eye, EyeOff, Mail, Phone, Clock
} from "lucide-react";

import api, { initialiseCsrf } from "./services/api";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const readSessionValue = (key, fallback) => {
  try {
    const storedValue = sessionStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallback;
  } catch {
    return fallback;
  }
};

function RoomCard({ room, onBook, onView }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [room.image_url]);

  return (
    <article className="stay-card">
      <div className="stay-image">
        {room.image_url && !imageFailed ? (
          <img
            src={room.image_url}
            alt={room.property_name || "PG accommodation"}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="image-placeholder">
            <BedDouble size={42} />
          </div>
        )}

        <span className="stay-badge">
          {room.room_type} sharing
        </span>

        {room.match_percentage !== undefined && (
          <span className="match-badge">
            <Sparkles size={13} />
            {room.match_percentage}% match
          </span>
        )}
      </div>

      <div className="stay-content">
        <div className="stay-location">
          <MapPin size={15} />
          {room.location || "Great location"}
        </div>

        <h3>
          {room.property_name || "PG Accommodation"}
          <span> · Room {room.room_number}</span>
        </h3>

        <div className="stay-details">
          <span>
            <BedDouble size={16} />
            {room.available_beds} beds available
          </span>
          <span>
            <ShieldCheck size={16} />
            Capacity {room.capacity}
          </span>
        </div>

        <div className="stay-facilities">
          {(room.facilities || []).slice(0, 4).map((facility) => (
            <span key={facility}>{facility}</span>
          ))}
        </div>

        <div className="stay-footer">
          <div className="stay-price">
            <strong>{money(room.price)}</strong>
            <small>/month</small>
          </div>

          <div className="stay-actions">
            <button className="text-action" onClick={() => onView(room)}>
              View details
            </button>
            <button
              className="primary-btn"
              onClick={() => onBook(room.id)}
              disabled={room.available_beds < 1}
            >
              {room.available_beds > 0 ? "Request stay" : "Full"}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [page, setPage] = useState(() =>
    readSessionValue("pgyora_page", "home")
  );
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(() =>
    readSessionValue("pgyora_selected_room", null)
  );
  const [bookings, setBookings] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dashboardTab, setDashboardTab] = useState(() =>
    readSessionValue("pgyora_dashboard_tab", "bookings")
  );
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: ""
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const [auth, setAuth] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: ""
  });

  const [filters, setFilters] = useState({
    location: "",
    max_price: "",
    room_type: ""
  });

  const [finder, setFinder] = useState({
    location: "",
    max_price: "",
    room_type: "",
    facilities: "WiFi, AC"
  });

  const [complaintForm, setComplaintForm] = useState({
    room: "",
    subject: "",
    description: ""
  });

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const navigate = (destination) => {
    setPage(destination);
    setMobileMenu(false);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToHomeSection = (sectionId) => {
    navigate("home");
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);
  };

  useEffect(() => {
    sessionStorage.setItem("pgyora_page", JSON.stringify(page));
  }, [page]);

  useEffect(() => {
    if (selectedRoom) {
      sessionStorage.setItem(
        "pgyora_selected_room",
        JSON.stringify(selectedRoom)
      );
    } else {
      sessionStorage.removeItem("pgyora_selected_room");
    }
  }, [selectedRoom]);

  useEffect(() => {
    sessionStorage.setItem(
      "pgyora_dashboard_tab",
      JSON.stringify(dashboardTab)
    );
  }, [dashboardTab]);

  const viewRoom = (room) => {
    setSelectedRoom(room);
    navigate("room");
  };

  
const getError = (error) => {
  const status = error.response?.status;
  const data = error.response?.data;

  if (data && typeof data === "object") {
    const directMessage = data.detail || data.message;
    if (directMessage) {
      return String(directMessage);
    }
  }

  if (status === 500) {
    return "Server error while processing your request. Please check the Django backend terminal.";
  }

  if (status === 403) {
    return "You are not authorized. Please log in or check your session.";
  }

  if (typeof data === "string") {
    if (data.trim().startsWith("<!DOCTYPE") ||
        data.trim().startsWith("<html")) {
      return "The server returned an error page. Check the backend terminal.";
    }

    return data;
  }

  if (data && typeof data === "object") {
    const collectMessages = (value) => {
      if (Array.isArray(value)) {
        return value.flatMap(collectMessages);
      }

      if (value && typeof value === "object") {
        return Object.values(value).flatMap(collectMessages);
      }

      return value ? [String(value)] : [];
    };

    const messages = collectMessages(data);
    if (messages.length > 0) {
      return messages.join(" | ");
    }
  }

  return error.message || "Something went wrong. Please try again.";
};


  const loadRooms = async (params = {}) => {
    try {
      setLoading(true);
      const response = await api.get("/api/rooms/", { params });
      setRooms(response.data);
    } catch (error) {
      setMessage(getError(error));
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await api.get("/api/accounts/profile/");
      setUser(response.data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || ""
      });
    }
  }, [user]);

  const loadDashboard = async () => {
    try {
      const [bookingResponse, complaintResponse] =
        await Promise.all([
          api.get("/api/bookings/"),
          api.get("/api/complaints/")
        ]);

      setBookings(bookingResponse.data);
      setComplaints(complaintResponse.data);
    } catch (error) {
      setMessage(getError(error));
    }
  };

  useEffect(() => {
    initialiseCsrf()
      .then(loadProfile)
      .catch(() => {});

    loadRooms();
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  
const handleAuth = async (event) => {
  event.preventDefault();
  setMessage("");

  try {
    const endpoint =
      page === "signup"
        ? "/api/accounts/register/"
        : "/api/accounts/login/";

    const payload =
      page === "signup"
        ? auth
        : {
            username: auth.username,
            password: auth.password
          };

    await api.post(endpoint, payload);

    const profileResponse = await api.get("/api/accounts/profile/");
    setUser(profileResponse.data);

    setAuth({
      username: "",
      password: "",
      first_name: "",
      last_name: "",
      email: ""
    });

    navigate("home");
  } catch (error) {
    setMessage(
      error.response
        ? getError(error)
        : error.message || "Login failed."
    );
  }
};

const saveProfile = async (event) => {
  event.preventDefault();
  setMessage("");

  if (!profileForm.email.trim() || !profileForm.email.includes("@")) {
    setMessage("Please enter a valid email address.");
    return;
  }

  try {
    setProfileSaving(true);
    const response = await api.patch(
      "/api/accounts/profile/",
      profileForm
    );
    setUser(response.data);
    setMessage("Profile updated successfully.");
  } catch (error) {
    setMessage(getError(error));
  } finally {
    setProfileSaving(false);
  }
};


  const logout = async () => {
    try {
      await api.post("/api/accounts/logout/");
    } catch {
      // Clear the local interface even if logout fails.
    }

    setUser(null);
    setBookings([]);
    setComplaints([]);
    navigate("home");
  };

  const searchRooms = async (event) => {
    event.preventDefault();
    await loadRooms(filters);
    navigate("explore");
  };

  const applyExploreFilters = async (nextFilters) => {
    setFilters(nextFilters);
    await loadRooms(nextFilters);
    navigate("explore");
  };

  const toggleFinderFacility = (facility) => {
    const selected = finder.facilities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const nextFacilities = selected.includes(facility)
      ? selected.filter((item) => item !== facility)
      : [...selected, facility];

    setFinder({
      ...finder,
      facilities: nextFacilities.join(", ")
    });
  };

  const findRooms = async (event) => {
    event.preventDefault();

    try {
      const response = await api.post("/api/rooms/find/", {
        ...finder,
        facilities: finder.facilities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      });

      setRooms(response.data);
      navigate("explore");
    } catch (error) {
      setMessage(getError(error));
    }
  };

  const bookRoom = async (roomId) => {
    if (!user) {
      navigate("login");
      return;
    }

    try {
      await api.post("/api/bookings/", { room: roomId });
      setMessage("Booking request submitted successfully!");
      await loadRooms();
      await loadDashboard();
    } catch (error) {
      setMessage(getError(error));
    }
  };

  const bookingAction = async (id, action) => {
    try {
      const endpoint = action === "cancel"
        ? `/api/bookings/${id}/cancel/`
        : `/api/bookings/${id}/${action}/`;
      if (action === "cancel") {
        await initialiseCsrf();
      }
      await api.post(endpoint);
      await loadDashboard();
      await loadRooms();
      setMessage("Booking updated successfully.");
    } catch (error) {
      setMessage(getError(error));
    }
  };

  const submitComplaint = async (event) => {
    event.preventDefault();

    try {
      await api.post("/api/complaints/", {
        ...complaintForm,
        room: complaintForm.room || null
      });

      setComplaintForm({
        room: "",
        subject: "",
        description: ""
      });

      await loadDashboard();
      setMessage("Complaint submitted successfully.");
    } catch (error) {
      setMessage(getError(error));
    }
  };

  const updateComplaint = async (id, status) => {
    try {
      await api.patch(`/api/complaints/${id}/`, { status });
      await loadDashboard();
      setMessage("Complaint status updated.");
    } catch (error) {
      setMessage(getError(error));
    }
  };

  return (
    <div className="pgyora-app">
      {/* NAVBAR */}
      <header className="site-navbar">
        <div className="site-container navbar-content">
          <button className="brand" onClick={() => navigate("home")}>
            <span className="brand-mark" aria-hidden="true">
              <Home size={22} strokeWidth={2.2} />
            </span>
            <span className="brand-name">
              <span className="brand-primary">PG</span>
              <span className="brand-accent">yora</span><b>.</b>
            </span>
          </button>

          <nav className={mobileMenu ? "nav-links open" : "nav-links"}>
            <button onClick={() => navigate("home")}>Home</button>
            <button
              onClick={() => {
                loadRooms();
                navigate("explore");
              }}
            >
              Explore stays
            </button>
            <button onClick={() => navigate("finder")}>
              Smart Finder
            </button>
            <button onClick={() => navigateToHomeSection("how-it-works")}>
              How it works
            </button>
            <button onClick={() => navigateToHomeSection("why-pgyora")}>
              Why PGyora
            </button>
            <button onClick={() => navigate("contact")}>
              Contact
            </button>
          </nav>

          <div className="navbar-actions">
            {user ? (
              <>
                <button
                  className="nav-text-btn"
                  onClick={() => navigate("dashboard")}
                >
                  <LayoutDashboard size={17} />
                  Dashboard
                </button>

                <button className="dark-btn" onClick={logout}>
                  Logout <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  className="nav-text-btn"
                  onClick={() => navigate("login")}
                >
                  Log in
                </button>

                <button
                  className="dark-btn"
                  onClick={() => navigate("signup")}
                >
                  Get started <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {message && (
        <div className="site-notification">
          {message}
          <button onClick={() => setMessage("")}>
            <X size={17} />
          </button>
        </div>
      )}

      {/* LANDING PAGE */}
      {page === "home" && (
        <>
          <section className="landing-hero">
            <div className="site-container hero-layout">
              <div className="hero-text">
                <div className="hero-eyebrow">
                  <Sparkles size={16} />
                  THE SMARTER WAY TO STAY
                </div>

                <h1>
                  Find a place that fits your{" "}
                  <em>next chapter.</em>
                </h1>

                <p>
                  Compare real rooms, understand what is included,
                  and send a booking request with confidence.
                </p>

                <form className="hero-search" onSubmit={searchRooms}>
                  <MapPin size={21} />

                  <input
                    placeholder="Where do you want to stay?"
                    value={filters.location}
                    onChange={(event) =>
                      setFilters({
                        ...filters,
                        location: event.target.value
                      })
                    }
                  />

                  <button type="submit" className="coral-btn">
                    Explore stays <ArrowRight size={17} />
                  </button>
                </form>

                <div className="hero-trust">
                  <div className="hero-avatars">
                    <span>A</span>
                    <span>S</span>
                    <span>R</span>
                    <span>M</span>
                  </div>

                  <div>
                    <div className="hero-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={14} fill="currentColor" />
                      ))}
                    </div>
                    <small>
                      Made for students & young professionals
                    </small>
                  </div>
                </div>

                <div className="hero-quick-links">
                  <button onClick={() => navigate("explore")}>
                    Browse live rooms <ArrowRight size={14} />
                  </button>
                  <button onClick={() => navigate("finder")}>
                    Find my best match <Sparkles size={14} />
                  </button>
                </div>

                <div className="hero-metrics">
                  <div>
                    <strong>{rooms.length || "—"}</strong>
                    <span>rooms to explore</span>
                  </div>
                  <div>
                    <strong>
                      {rooms.reduce(
                        (total, room) => total + Number(room.available_beds || 0),
                        0
                      ) || "—"}
                    </strong>
                    <span>beds currently open</span>
                  </div>
                </div>
              </div>

              <div className="hero-photo">
                <img
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop"
                  alt="Modern furnished accommodation"
                />

                <div className="floating-card floating-top">
                  <span className="floating-icon">
                    <Sparkles size={20} />
                  </span>
                  <div>
                    <strong>Smart matching</strong>
                    <small>Find your perfect fit</small>
                  </div>
                </div>

                <div className="floating-card floating-bottom">
                  <span className="floating-icon green">
                    <CheckCircle2 size={20} />
                  </span>
                  <div>
                    <strong>Move in with confidence</strong>
                    <small>Everything in one place</small>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="trust-bar">
            <div className="site-container trust-items">
              <span><ShieldCheck /> Safe booking requests</span>
              <span><Sparkles /> Personalised matching</span>
              <span><BedDouble /> Live room availability</span>
              <span><Wrench /> Support after move-in</span>
            </div>
          </section>

          <section id="why-pgyora" className="site-container home-value-section">
            <div className="section-heading">
              <div>
                <span className="section-label">A BETTER WAY TO FIND A PG</span>
                <h2>Everything you need to choose <em>well.</em></h2>
              </div>
              <p className="section-heading-note">
                Less guesswork. More confidence before you move in.
              </p>
            </div>

            <div className="value-grid">
              <article className="value-card">
                <span className="value-icon coral"><Search size={21} /></span>
                <h3>Search your way</h3>
                <p>Filter by location, budget, sharing type and the facilities that matter to you.</p>
              </article>
              <article className="value-card">
                <span className="value-icon green"><ShieldCheck size={21} /></span>
                <h3>Know before you request</h3>
                <p>See room details, availability, pricing and included facilities in one clear view.</p>
              </article>
              <article className="value-card">
                <span className="value-icon gold"><CalendarDays size={21} /></span>
                <h3>Manage your stay</h3>
                <p>Track booking requests, approvals and support complaints from your dashboard.</p>
              </article>
            </div>
          </section>

          <section id="how-it-works" className="site-container home-process-section">
            <div className="section-heading">
              <div>
                <span className="section-label">FROM SEARCH TO MOVE-IN</span>
                <h2>Make a confident decision in <em>three steps.</em></h2>
              </div>
            </div>

            <div className="process-grid">
              <article className="process-card">
                <span className="process-number">01</span>
                <MapPin size={22} />
                <h3>Choose your area</h3>
                <p>Start with the location, commute or neighbourhood that works for your everyday life.</p>
              </article>
              <article className="process-card featured">
                <span className="process-number">02</span>
                <Search size={22} />
                <h3>Compare real options</h3>
                <p>Review pricing, sharing type, facilities and available beds before you send a request.</p>
              </article>
              <article className="process-card">
                <span className="process-number">03</span>
                <CheckCircle2 size={22} />
                <h3>Request with clarity</h3>
                <p>Track your booking status and keep your accommodation journey organised in one place.</p>
              </article>
            </div>
          </section>

          <section className="site-container content-section">
            <div className="section-heading">
              <div>
                <span className="section-label">HANDPICKED FOR YOU</span>
                <h2>Spaces worth calling <em>home.</em></h2>
                <p>Explore available rooms and find your perfect fit.</p>
              </div>

              <button
                className="link-arrow"
                onClick={() => {
                  loadRooms();
                  navigate("explore");
                }}
              >
                View all stays <ArrowRight size={18} />
              </button>
            </div>

            <div className="stays-grid">
              {rooms.slice(0, 3).map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onBook={bookRoom}
                  onView={viewRoom}
                />
              ))}
            </div>

            {rooms.length === 0 && (
              <p className="empty-message">
                No properties yet. Add rooms through Django Admin.
              </p>
            )}
          </section>

          <section className="home-cta-section">
            <div className="site-container home-cta">
              <div>
                <span className="section-label">READY WHEN YOU ARE</span>
                <h2>Your next room search starts <em>here.</em></h2>
                <p>Browse what is available today or let PGyora narrow it down around your preferences.</p>
              </div>
              <div className="home-cta-actions">
                <button className="coral-btn" onClick={() => navigate("explore")}>
                  Browse available rooms <ArrowRight size={17} />
                </button>
                <button className="light-btn" onClick={() => navigate("finder")}>
                  Start a smart match <Sparkles size={17} />
                </button>
              </div>
            </div>
          </section>

        </>
      )}

      {/* LOGIN AND SIGNUP */}
      {page === "contact" && (
        <main className="contact-page">
          <section className="contact-hero">
            <div className="site-container contact-hero-content">
              <span className="section-label">WE ARE HERE TO HELP</span>
              <h1>Let’s make your next move <em>easier.</em></h1>
              <p>
                Have a question about a room, booking request or your
                PGyora account? Send us a message and our support team
                will help you find the right next step.
              </p>
            </div>
          </section>

          <section className="site-container contact-content">
            <div className="contact-info">
              <span className="section-label">CONTACT PGYORA</span>
              <h2>Support that feels <em>human.</em></h2>
              <p>
                We keep the process simple, transparent and easy to
                follow—from your first question to move-in day.
              </p>

              <div className="contact-info-list">
                <a href="mailto:support@pgyora.com">
                  <span><Mail size={19} /></span>
                  <div><strong>Email us</strong><small>support@pgyora.com</small></div>
                </a>
                <a href="tel:+911800123456">
                  <span><Phone size={19} /></span>
                  <div><strong>Call support</strong><small>+91 1800 123 456</small></div>
                </a>
                <div>
                  <span><Clock size={19} /></span>
                  <div><strong>Support hours</strong><small>Mon–Sat · 9:00 AM–7:00 PM</small></div>
                </div>
              </div>

              <div className="contact-faq">
                <strong>Looking for a quick answer?</strong>
                <p>Check your dashboard for booking updates, room details and complaint status.</p>
                <button className="link-arrow" onClick={() => navigate(user ? "dashboard" : "login")}>
                  {user ? "Open my dashboard" : "Log in to your account"} <ArrowRight size={17} />
                </button>
              </div>
            </div>

            <form
              className="contact-form"
              onSubmit={(event) => {
                event.preventDefault();
                const subject = encodeURIComponent(contactForm.subject || "PGyora support request");
                const body = encodeURIComponent(
                  `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\n${contactForm.message}`
                );
                window.location.href = `mailto:support@pgyora.com?subject=${subject}&body=${body}`;
                setMessage("Your email app is opening with the message prepared.");
              }}
            >
              <h2>Send us a message</h2>
              <p>We usually reply within one business day.</p>

              <div className="form-two-columns">
                <label>
                  Your name
                  <input
                    required
                    value={contactForm.name}
                    onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
                    placeholder="Your name"
                  />
                </label>
                <label>
                  Email address
                  <input
                    required
                    type="email"
                    value={contactForm.email}
                    onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })}
                    placeholder="you@example.com"
                  />
                </label>
              </div>

              <label>
                What can we help with?
                <select
                  required
                  value={contactForm.subject}
                  onChange={(event) => setContactForm({ ...contactForm, subject: event.target.value })}
                >
                  <option value="">Select a topic</option>
                  <option value="Room availability">Room availability</option>
                  <option value="Booking request">Booking request</option>
                  <option value="Account help">Account help</option>
                  <option value="General question">General question</option>
                </select>
              </label>

              <label>
                Message
                <textarea
                  required
                  rows="6"
                  value={contactForm.message}
                  onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })}
                  placeholder="Tell us a little more..."
                />
              </label>

              <button className="coral-btn" type="submit">
                Send message <ArrowRight size={17} />
              </button>
            </form>
          </section>
        </main>
      )}

      {/* LOGIN AND SIGNUP */}
      {(page === "login" || page === "signup") && (
        <main className="auth-layout">
          <div className="auth-visual">
            <div className="auth-visual-content">
              <span className="section-label">
                YOUR SPACE. YOUR STORY.
              </span>

              <h2>
                Good spaces.
                <br />
                Great beginnings.
              </h2>

              <p>
                Find a stay that feels like yours,
                from day one.
              </p>

              <div className="auth-quote">
                <div>★★★★★</div>
                <p>
                  "Finding the right room should feel exciting,
                  not exhausting."
                </p>
                <small>— The PGyora promise</small>
              </div>
            </div>
          </div>

          <div className="auth-form-side">
            <div className="auth-form-box">
              <button
                className="back-button"
                onClick={() => navigate("home")}
              >
                ← Back to home
              </button>

              <div className="auth-logo">
                <Home size={27} />
              </div>

              <span className="section-label">
                {page === "signup"
                  ? "JOIN THE COMMUNITY"
                  : "WELCOME BACK"}
              </span>

              <h1>
                {page === "signup"
                  ? "Create your account"
                  : "Nice to see you again."}
              </h1>

              <p>
                {page === "signup"
                  ? "Your next home is just a few clicks away."
                  : "Log in to continue your PGyora journey."}
              </p>

              <form className="modern-auth-form" onSubmit={handleAuth}>
                {page === "signup" && (
                  <>
                    <div className="form-two-columns">
                      <label>
                        First name
                        <input
                          required
                          placeholder="First name"
                          value={auth.first_name}
                          onChange={(event) =>
                            setAuth({
                              ...auth,
                              first_name: event.target.value
                            })
                          }
                        />
                      </label>

                      <label>
                        Last name
                        <input
                          placeholder="Last name"
                          value={auth.last_name}
                          onChange={(event) =>
                            setAuth({
                              ...auth,
                              last_name: event.target.value
                            })
                          }
                        />
                      </label>
                    </div>

                    <label>
                      Email address
                      <input
                        required
                        type="email"
                        placeholder="you@example.com"
                        value={auth.email}
                        onChange={(event) =>
                          setAuth({
                            ...auth,
                            email: event.target.value
                          })
                        }
                      />
                    </label>
                  </>
                )}

                <label>
                  Username
                  <input
                    required
                    placeholder="Enter your username"
                    value={auth.username}
                    onChange={(event) =>
                      setAuth({
                        ...auth,
                        username: event.target.value
                      })
                    }
                  />
                </label>

                <label>
                  Password
                  <div className="password-wrapper">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={auth.password}
                      onChange={(event) =>
                        setAuth({
                          ...auth,
                          password: event.target.value
                        })
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                    >
                      {showPassword
                        ? <EyeOff size={19} />
                        : <Eye size={19} />}
                    </button>
                  </div>
                </label>

                <button className="coral-btn auth-submit">
                  {page === "signup"
                    ? "Create my account"
                    : "Log in to my account"}
                  <ArrowRight size={18} />
                </button>
              </form>

              <p className="auth-switch">
                {page === "signup"
                  ? "Already have an account?"
                  : "New to PGyora?"}

                <button
                  onClick={() =>
                    navigate(
                      page === "signup" ? "login" : "signup"
                    )
                  }
                >
                  {page === "signup"
                    ? "Log in"
                    : "Create an account"}
                </button>
              </p>

              <div className="auth-security">
                <ShieldCheck size={16} />
                Secure session-based authentication
              </div>
            </div>
          </div>
        </main>
      )}

      {/* EXPLORE PAGE */}
      {page === "explore" && (
        <main className="site-container inner-page">
          <div className="inner-heading">
            <span className="section-label">
              DISCOVER YOUR NEXT STAY
            </span>

            <h1>Browse rooms that fit <em>your life.</em></h1>

            <p>
              Explore live availability and narrow your choices
              with practical filters.
            </p>
          </div>

          <form className="explore-filters" onSubmit={searchRooms}>
            <input
              placeholder="City or location"
              value={filters.location}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  location: event.target.value
                })
              }
            />

            <input
              type="number"
              placeholder="Maximum monthly rent"
              value={filters.max_price}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  max_price: event.target.value
                })
              }
            />

            <select
              value={filters.room_type}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  room_type: event.target.value
                })
              }
            >
              <option value="">Any sharing type</option>
              <option value="single">Single sharing</option>
              <option value="double">Double sharing</option>
              <option value="triple">Triple sharing</option>
            </select>

            <button className="dark-btn">
              <Search size={18} />
              Search stays
            </button>
          </form>

          <div className="explore-quick-filters">
            <span>Quick filters</span>
            <button onClick={() => applyExploreFilters({ ...filters, room_type: "single" })}>Single sharing</button>
            <button onClick={() => applyExploreFilters({ ...filters, room_type: "double" })}>Double sharing</button>
            <button onClick={() => applyExploreFilters({ ...filters, max_price: "10000" })}>Under ₹10,000</button>
            <button onClick={() => applyExploreFilters({ location: "", max_price: "", room_type: "" })}>Clear all</button>
          </div>

          <div className="results-heading">
            <div>
              <h2>Available spaces ({rooms.length})</h2>
              <p>Only rooms with current availability are shown.</p>
            </div>

            <button onClick={() => navigate("finder")}>
              <Sparkles size={17} />
              Try Smart Finder
            </button>
          </div>

          <div className="stays-grid">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onBook={bookRoom}
                onView={viewRoom}
              />
            ))}
          </div>

          {loading && (
            <div className="loading-state">
            <span className="loading-spinner" />
            Finding spaces that match your search...
            </div>
          )}

          {!loading && rooms.length === 0 && (
            <p className="empty-message">
              No rooms found. Try different filters.
            </p>
          )}
        </main>
      )}

      {/* ROOM DETAIL */}
      {page === "room" && selectedRoom && (
        <main className="site-container inner-page room-detail-page">
          <button className="back-button" onClick={() => navigate("explore")}>
            ← Back to available stays
          </button>

          <div className="room-detail-layout">
            <div className="room-detail-image">
            {selectedRoom.image_url ? (
              <img
                src={selectedRoom.image_url}
                alt={selectedRoom.property_name || "Accommodation"}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="image-placeholder"><BedDouble size={72} /></div>
            )}
            <span className="stay-badge">{selectedRoom.room_type} sharing</span>
            </div>

            <div className="room-detail-copy">
            <span className="section-label">A SPACE TO CALL YOUR OWN</span>
            <h1>{selectedRoom.property_name || "PGyora room"}</h1>
            <p className="room-detail-location">
              <MapPin size={17} /> {selectedRoom.location || "Great location"} · Room {selectedRoom.room_number}
            </p>
            <p className="room-description">
              {selectedRoom.description || "A comfortable, thoughtfully planned room with the essentials for a smooth and independent stay."}
            </p>

            <div className="room-detail-stats">
              <div><strong>{money(selectedRoom.price)}</strong><span>monthly</span></div>
              <div><strong>{selectedRoom.available_beds}</strong><span>beds available</span></div>
              <div><strong>{selectedRoom.capacity}</strong><span>total capacity</span></div>
            </div>

            <h3>Included with your stay</h3>
            <div className="detail-facilities">
              {(selectedRoom.facilities || []).map((facility) => (
                <span key={facility}><CheckCircle2 size={15} /> {facility}</span>
              ))}
              {(!selectedRoom.facilities || selectedRoom.facilities.length === 0) && (
                <span><CheckCircle2 size={15} /> Essential amenities</span>
              )}
            </div>

            <button
              className="coral-btn detail-cta"
              onClick={() => bookRoom(selectedRoom.id)}
              disabled={selectedRoom.available_beds < 1}
            >
              {selectedRoom.available_beds > 0 ? "Request this room" : "Currently full"}
              <ArrowRight size={18} />
            </button>
            </div>
          </div>
        </main>
      )}

      {/* SMART ROOM FINDER */}
      {page === "finder" && (
        <main className="site-container inner-page">
          <div className="inner-heading">
            <span className="section-label">
              PGYORA SMART MATCH
            </span>

            <h1>Let's find your <em>perfect fit.</em></h1>

            <p>
              Tell us what matters to you and we'll
              recommend matching rooms.
            </p>
          </div>

          <div className="finder-layout">
            <aside className="finder-guide">
              <div className="finder-icon">
                <Sparkles size={30} />
              </div>
              <span className="section-label">HOW IT WORKS</span>
              <h2>A shortlist made for <em>you.</em></h2>
              <p>Share a few preferences and PGyora will rank available rooms around them.</p>
              <ol>
                <li><span>1</span>Tell us where you want to live.</li>
                <li><span>2</span>Set your budget and sharing style.</li>
                <li><span>3</span>Choose the facilities you need.</li>
              </ol>
              <small>Recommendations are transparent and based on your selected preferences.</small>
            </aside>

            <div className="finder-card">
              <div className="finder-title">
                <div>
                  <h2>Your room preferences</h2>
                  <p>Build your shortlist in under a minute.</p>
                </div>
              </div>

              <form className="finder-form" onSubmit={findRooms}>
              <label>
                Preferred location
                <input
                  placeholder="e.g. Phagwara"
                  value={finder.location}
                  onChange={(event) =>
                    setFinder({
                      ...finder,
                      location: event.target.value
                    })
                  }
                />
              </label>

              <label>
                Maximum monthly budget
                <input
                  type="number"
                  placeholder="e.g. 8000"
                  value={finder.max_price}
                  onChange={(event) =>
                    setFinder({
                      ...finder,
                      max_price: event.target.value
                    })
                  }
                />
              </label>

              <label>
                Sharing preference
                <select
                  value={finder.room_type}
                  onChange={(event) =>
                    setFinder({
                      ...finder,
                      room_type: event.target.value
                    })
                  }
                >
                  <option value="">Any type</option>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="triple">Triple</option>
                </select>
              </label>

              <label className="finder-facilities">
                Must-have facilities
                <div className="facility-chips">
                  {["WiFi", "AC", "Power backup", "Laundry", "Food"].map((facility) => {
                    const selected = finder.facilities
                      .split(",")
                      .map((item) => item.trim())
                      .includes(facility);
                    return (
                      <button
                        type="button"
                        className={selected ? "facility-chip active" : "facility-chip"}
                        key={facility}
                        onClick={() => toggleFinderFacility(facility)}
                      >
                        {facility} {selected && <CheckCircle2 size={14} />}
                      </button>
                    );
                  })}
                </div>
                <input
                  placeholder="Or type another facility"
                  value={finder.facilities}
                  onChange={(event) =>
                    setFinder({
                      ...finder,
                      facilities: event.target.value
                    })
                  }
                />
              </label>

              <button className="coral-btn">
                Find matching rooms <ArrowRight size={18} />
              </button>
              </form>
            </div>
          </div>
        </main>
      )}

      {/* DASHBOARD */}
      {page === "dashboard" && (
        <main className="site-container inner-page">
          {!user ? (
            <div className="dashboard-card">
              <h2>Please log in first</h2>
              <button
                className="coral-btn"
                onClick={() => navigate("login")}
              >
                Log in
              </button>
            </div>
          ) : (
            <>
              <div className="inner-heading">
                <span className="section-label">
                  YOUR PGYORA SPACE
                </span>

                <h1>
                  Welcome back,{" "}
                  <em>{user.first_name || user.username}.</em>
                </h1>

                <p>
                  Manage your bookings and accommodation requests.
                </p>
              </div>

              <div className="dashboard-tabs">
                <button
                  className={dashboardTab === "bookings" ? "active" : ""}
                  onClick={() => setDashboardTab("bookings")}
                >
                  Bookings
                </button>

                <button
                  className={dashboardTab === "complaints" ? "active" : ""}
                  onClick={() => setDashboardTab("complaints")}
                >
                  Complaints
                </button>

                <button
                  className={dashboardTab === "profile" ? "active" : ""}
                  onClick={() => setDashboardTab("profile")}
                >
                  Profile
                </button>
              </div>

              {dashboardTab === "bookings" && (
                <>
                  <div className="dashboard-stats">
                    <div className="stat-card"><span className="stat-icon coral"><CalendarDays size={20} /></span><strong>{bookings.length}</strong><small>Total requests</small></div>
                    <div className="stat-card"><span className="stat-icon green"><CheckCircle2 size={20} /></span><strong>{bookings.filter((item) => item.status === "approved").length}</strong><small>Approved stays</small></div>
                    <div className="stat-card"><span className="stat-icon gold"><Wrench size={20} /></span><strong>{complaints.filter((item) => item.status !== "resolved").length}</strong><small>Open complaints</small></div>
                  </div>
                  <div className="dashboard-card">
                  <h2>Booking requests</h2>

                  {bookings.map((booking) => (
                    <div className="dashboard-row" key={booking.id}>
                      <div>
                        <strong>
                          {booking.property_name} · Room{" "}
                          {booking.room_number}
                        </strong>

                        <p>Status: <span className={`status-pill ${booking.status}`}>{booking.status}</span></p>
                      </div>

                      <div className="dashboard-actions">
                        {user.role === "admin" &&
                          booking.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  bookingAction(
                                    booking.id,
                                    "approve"
                                  )
                                }
                              >
                                Approve
                              </button>

                              <button
                                onClick={() =>
                                  bookingAction(
                                    booking.id,
                                    "reject"
                                  )
                                }
                              >
                                Reject
                              </button>
                            </>
                          )}

                        {["pending", "approved"].includes(
                          booking.status
                        ) && (
                          <button
                            onClick={() =>
                              bookingAction(
                                booking.id,
                                "cancel"
                              )
                            }
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {bookings.length === 0 && (
                    <div className="empty-message">
                      <CalendarDays size={30} />
                      <p>No booking requests yet.</p>
                      <button className="coral-btn" onClick={() => navigate("explore")}>Explore available stays</button>
                    </div>
                  )}
                  </div>
                </>
              )}

              {dashboardTab === "complaints" && (
                <div className="dashboard-card">
                  <h2>Maintenance complaints</h2>

                  {user.role !== "admin" && (
                    <form
                      className="finder-form"
                      onSubmit={submitComplaint}
                    >
                      <label>
                        Room
                        <select
                          value={complaintForm.room}
                          onChange={(event) =>
                            setComplaintForm({
                              ...complaintForm,
                              room: event.target.value
                            })
                          }
                        >
                          <option value="">Select room (optional)</option>

                          {rooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.property_name} · {room.room_number}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Subject
                        <input
                          required
                          value={complaintForm.subject}
                          onChange={(event) =>
                            setComplaintForm({
                              ...complaintForm,
                              subject: event.target.value
                            })
                          }
                        />
                      </label>

                      <label>
                        Description
                        <textarea
                          required
                          rows="3"
                          value={complaintForm.description}
                          onChange={(event) =>
                            setComplaintForm({
                              ...complaintForm,
                              description: event.target.value
                            })
                          }
                        />
                      </label>

                      <button className="coral-btn">
                        Submit complaint
                      </button>
                    </form>
                  )}

                  {complaints.length === 0 && (
                    <div className="empty-message">
                      <Wrench size={30} />
                      <p>No complaints to show.</p>
                    </div>
                  )}

                  {complaints.map((complaint) => (
                    <div className="dashboard-row" key={complaint.id}>
                      <div>
                        <strong>{complaint.subject}</strong>
                        <p>{complaint.description}</p>
                        <small className={`status-pill ${complaint.status}`}>{complaint.status.replace("_", " ")}</small>
                      </div>

                      {user.role === "admin" && (
                        <select
                          value={complaint.status}
                          onChange={(event) =>
                            updateComplaint(
                              complaint.id,
                              event.target.value
                            )
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">
                            In progress
                          </option>
                          <option value="resolved">Resolved</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {dashboardTab === "profile" && (
                <div className="dashboard-card">
                  <div className="profile-header">
                    <div className="profile-avatar">
                      {(user.first_name || user.username || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="section-label">YOUR ACCOUNT</span>
                      <h2>{user.first_name || user.username}'s profile</h2>
                      <p>Keep your details up to date for a smoother stay experience.</p>
                    </div>
                  </div>

                  <div className="profile-meta">
                    <span><strong>Username</strong>{user.username}</span>
                    <span><strong>Account type</strong>{user.role}</span>
                  </div>

                  <form className="profile-form" onSubmit={saveProfile}>
                    <div className="form-two-columns">
                      <label>
                        First name
                        <input
                          required
                          value={profileForm.first_name}
                          onChange={(event) =>
                            setProfileForm({
                              ...profileForm,
                              first_name: event.target.value
                            })
                          }
                        />
                      </label>
                      <label>
                        Last name
                        <input
                          value={profileForm.last_name}
                          onChange={(event) =>
                            setProfileForm({
                              ...profileForm,
                              last_name: event.target.value
                            })
                          }
                        />
                      </label>
                    </div>

                    <label>
                      Email address
                      <input
                        required
                        type="email"
                        value={profileForm.email}
                        onChange={(event) =>
                          setProfileForm({
                            ...profileForm,
                            email: event.target.value
                          })
                        }
                      />
                    </label>

                    <button className="coral-btn profile-save" disabled={profileSaving}>
                      {profileSaving ? "Saving changes..." : "Save profile"}
                      {!profileSaving && <CheckCircle2 size={17} />}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      )}

      {/* FOOTER */}
      <footer id="support" className="site-footer">
        <div className="site-container footer-content">
          <div>
            <h3>PGyora.</h3>
            <p>
              Good spaces. Great beginnings.
              <br />
              A smarter way to find where you belong.
            </p>
          </div>

          <div>
            <h4>Explore</h4>
            <button onClick={() => navigate("explore")}>
              Browse stays
            </button>
            <button onClick={() => navigate("finder")}>
              Smart Room Finder
            </button>
            <button onClick={() => navigate("contact")}>
              Contact us
            </button>
          </div>

          <div>
            <h4>Account</h4>
            <button onClick={() => navigate("login")}>
              Log in
            </button>
            <button onClick={() => navigate("signup")}>
              Get started
            </button>
          </div>
        </div>

        <div className="footer-copyright">
          © {new Date().getFullYear()} PGyora.
          Made for a better stay.
        </div>
      </footer>
    </div>
  );
}
