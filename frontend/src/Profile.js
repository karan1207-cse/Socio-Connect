import { useEffect, useState } from "react";
import API from "./api";
import "./Profile.css";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [createdActivities, setCreatedActivities] = useState([]);
  const [joinedActivities, setJoinedActivities] = useState([]);
  const [activeTab, setActiveTab] = useState("created");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    const fetchCreated = async () => {
      try {
        const res = await API.get("/users/my-activities", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCreatedActivities(res.data);
      } catch (err) {
        console.error("Error fetching created activities:", err);
      }
    };

    const fetchJoined = async () => {
      try {
        const res = await API.get("/users/joined-activities", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setJoinedActivities(res.data);
      } catch (err) {
        console.error("Error fetching joined activities:", err);
      }
    };

    fetchProfile();
    fetchCreated();
    fetchJoined();
  }, [token]);

  const getReliabilityColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const getStatusBadge = (status) => {
    if (status === "attended") return { text: "Attended", className: "status-attended" };
    if (status === "no-show") return { text: "No Show", className: "status-noshow" };
    return { text: "Joined", className: "status-joined" };
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (!profile) {
    return (
      <>
        <div className="navbar">
          <h2 onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>Socio-Connect</h2>
          <div className="nav-actions">
            <button className="nav-btn" onClick={() => navigate("/dashboard")}>Feed</button>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <div className="profile-container">
          <div className="profile-loading">Loading profile...</div>
        </div>
      </>
    );
  }

  const reliabilityScore = profile.reliability || 0;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (reliabilityScore / 100) * circumference;

  return (
    <>
      <div className="navbar">
        <h2 onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>Socio-Connect</h2>
        <div className="nav-actions">
          <button className="nav-btn" onClick={() => navigate("/dashboard")}>Feed</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="profile-container">
        {/* Profile Header Card */}
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.name?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h1>{profile.name}</h1>
            <p className="profile-email">{profile.email}</p>
            <div className="profile-tags">
              <span className="profile-tag">📍 {profile.area}</span>
              <span className="profile-tag">🎂 {profile.age} years</span>
            </div>
          </div>
          <div className="reliability-ring">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke={getReliabilityColor(reliabilityScore)}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div className="reliability-text">
              <span className="reliability-number">{reliabilityScore}%</span>
              <span className="reliability-label">Reliable</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-number">{profile.total_created}</span>
            <span className="stat-label">Created</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{profile.total_joined}</span>
            <span className="stat-label">Joined</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{profile.total_attended}</span>
            <span className="stat-label">Attended</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {profile.total_joined > 0
                ? Math.round((profile.total_attended / profile.total_joined) * 100)
                : 100}%
            </span>
            <span className="stat-label">Show-up Rate</span>
          </div>
        </div>

        {/* Activity History Tabs */}
        <div className="profile-tabs">
          <button
            onClick={() => setActiveTab("created")}
            className={activeTab === "created" ? "active-tab" : "inactive-tab"}
          >
            📋 Created ({createdActivities.length})
          </button>
          <button
            onClick={() => setActiveTab("joined")}
            className={activeTab === "joined" ? "active-tab" : "inactive-tab"}
          >
            🤝 Joined ({joinedActivities.length})
          </button>
        </div>

        {/* Activity Lists */}
        <div className="activity-history">
          {activeTab === "created" && (
            <>
              {createdActivities.length === 0 ? (
                <div className="empty-state">
                  <p>You haven't created any activities yet.</p>
                </div>
              ) : (
                createdActivities.map((activity) => (
                  <div key={activity.id} className="history-card">
                    <div className="history-card-header">
                      <h3>{activity.title}</h3>
                      <span className="history-participants">
                        👥 {activity.participants_count}
                      </span>
                    </div>
                    <p className="history-desc">{activity.description}</p>
                    <div className="history-meta">
                      <span>📍 {activity.location}</span>
                      <span>🕒 {new Date(activity.activity_time).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === "joined" && (
            <>
              {joinedActivities.length === 0 ? (
                <div className="empty-state">
                  <p>You haven't joined any activities yet.</p>
                </div>
              ) : (
                joinedActivities.map((activity) => {
                  const badge = getStatusBadge(activity.status);
                  return (
                    <div key={activity.id} className="history-card">
                      <div className="history-card-header">
                        <h3>{activity.title}</h3>
                        <span className={`status-badge ${badge.className}`}>
                          {badge.text}
                        </span>
                      </div>
                      <p className="history-desc">{activity.description}</p>
                      <div className="history-meta">
                        <span>📍 {activity.location}</span>
                        <span>🕒 {new Date(activity.activity_time).toLocaleString()}</span>
                        <span>👤 by {activity.creator_name}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Profile;
