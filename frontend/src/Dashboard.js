import { useEffect, useState } from "react";
import API from "./api";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function Dashboard() {
  const [activities, setActivities] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : null;
  const currentUserId = decoded?.id;
  const [areaInput, setAreaInput] = useState("");
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [activeTab, setActiveTab] = useState("rightNow");
  const [activityTime, setActivityTime] = useState("");
  const [participants, setParticipants] = useState({});
  const [openActivityId, setOpenActivityId] = useState(null);

  // Edit modal state
  const [editingActivity, setEditingActivity] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAreaInput, setEditAreaInput] = useState("");
  const [editAreaSuggestions, setEditAreaSuggestions] = useState([]);
  const [editSelectedArea, setEditSelectedArea] = useState("");
  const [editTime, setEditTime] = useState("");

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/activities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities(res.data);
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem("token");
      const formattedTime = activityTime
        ? activityTime.replace("T", " ") + ":00"
        : null;
      if (!selectedArea) {
        alert("Please select a valid area from suggestions");
        return;
      }
      await API.post(
        "/activities/create",
        {
          title,
          description,
          location: selectedArea,
          activity_time: formattedTime,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTitle("");
      setDescription("");
      setActivityTime("");
      setSelectedArea("");
      setAreaInput("");
      await fetchActivities();
    } catch (err) {
      console.error("Error creating activity:", err);
    }
  };

  const handleJoin = async (activityId) => {
    try {
      const token = localStorage.getItem("token");
      await API.post(
        `/activities/join/${activityId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchActivities();
      if (openActivityId === activityId) {
        fetchParticipants(activityId);
      }
    } catch (err) {
      console.error("Error joining activity:", err);
    }
  };

  const handleMarkAttendance = async (activityId, userId, status) => {
    try {
      const token = localStorage.getItem("token");
      await API.post(
        `/activities/mark-attendance/${activityId}`,
        { userId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchActivities();
      fetchParticipants(activityId);
    } catch (err) {
      console.error("Error marking attendance:", err);
    }
  };

  const handleLeave = async (activityId) => {
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/activities/leave/${activityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchActivities();
      if (openActivityId === activityId) {
        fetchParticipants(activityId);
      }
    } catch (err) {
      console.error("Error leaving activity:", err);
    }
  };

  // Edit Activity
  const openEditModal = (activity) => {
    setEditingActivity(activity);
    setEditTitle(activity.title);
    setEditDescription(activity.description);
    setEditAreaInput(activity.location);
    setEditSelectedArea(activity.location);
    // Format datetime for input
    const dt = new Date(activity.activity_time);
    const formatted = dt.toISOString().slice(0, 16);
    setEditTime(formatted);
  };

  const handleEdit = async () => {
    try {
      const token = localStorage.getItem("token");
      const formattedTime = editTime
        ? editTime.replace("T", " ") + ":00"
        : null;
      if (!editSelectedArea) {
        alert("Please select a valid area from suggestions");
        return;
      }
      await API.put(
        `/activities/edit/${editingActivity.id}`,
        {
          title: editTitle,
          description: editDescription,
          location: editSelectedArea,
          activity_time: formattedTime,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingActivity(null);
      await fetchActivities();
    } catch (err) {
      console.error("Error editing activity:", err);
      alert(err.response?.data?.message || "Error editing activity");
    }
  };

  // Delete Activity
  const handleDelete = async (activityId) => {
    if (!window.confirm("Are you sure you want to delete this activity? This cannot be undone.")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/activities/delete/${activityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchActivities();
    } catch (err) {
      console.error("Error deleting activity:", err);
      alert(err.response?.data?.message || "Error deleting activity");
    }
  };

  const isHappeningSoon = (time) => {
    const now = new Date();
    const activityTime = new Date(time);
    const diff = activityTime - now;
    const twoHours = 2 * 60 * 60 * 1000;
    return diff > 0 && diff <= twoHours;
  };

  const isExpired = (time) => {
    return new Date(time) < new Date();
  };

  const sortedActivities = [...activities].sort(
    (a, b) => new Date(a.activity_time) - new Date(b.activity_time)
  );

  const filteredActivities = sortedActivities.filter((activity) => {
    const now = new Date();
    const activityDate = new Date(activity.activity_time);
    const fiveMinutes = 2 * 60 * 1000;

    if (now - activityDate > fiveMinutes) {
      return false;
    }

    const happeningSoon = isHappeningSoon(activity.activity_time);

    if (activeTab === "rightNow") {
      return happeningSoon;
    }
    if (activeTab === "planned") {
      return !happeningSoon;
    }
    return true;
  });

  const fetchParticipants = async (activityId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/activities/${activityId}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setParticipants((prev) => ({
        ...prev,
        [activityId]: res.data,
      }));
    } catch (err) {
      console.error("Error fetching participants:", err);
    }
  };

  const fetchAreas = async (value) => {
    try {
      const res = await API.get(`/areas?search=${value}`);
      setAreaSuggestions(res.data);
    } catch (err) {
      console.error("Error fetching areas:", err);
    }
  };

  const fetchEditAreas = async (value) => {
    try {
      const res = await API.get(`/areas?search=${value}`);
      setEditAreaSuggestions(res.data);
    } catch (err) {
      console.error("Error fetching areas:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const getReliabilityBadge = (score) => {
    if (score >= 80) return { className: "reliability-high", label: "Reliable" };
    if (score >= 50) return { className: "reliability-mid", label: "Average" };
    return { className: "reliability-low", label: "Unreliable" };
  };

  return (
    <>
      <div className="navbar">
        <h2>Socio-Connect</h2>
        <div className="nav-actions">
          <button className="nav-btn" onClick={() => navigate("/profile")}>
            👤 Profile
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Create Activity */}
        <div className="create-section">
          <h3>Create Activity</h3>

          <input
            placeholder="Activity title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            placeholder="What's it about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            placeholder="Select Area"
            value={areaInput}
            onChange={(e) => {
              const value = e.target.value;
              setAreaInput(value);
              setSelectedArea("");
              fetchAreas(value);
            }}
          />

          {areaSuggestions.length > 0 && (
            <ul className="area-suggestions">
              {areaSuggestions.map((area, index) => (
                <li
                  key={index}
                  onClick={() => {
                    setSelectedArea(area.name);
                    setAreaInput(area.name);
                    setAreaSuggestions([]);
                  }}
                >
                  {area.name}
                </li>
              ))}
            </ul>
          )}

          <input
            type="datetime-local"
            value={activityTime}
            onChange={(e) => setActivityTime(e.target.value)}
          />

          <button className="create-btn" onClick={handleCreate}>
            + Create Activity
          </button>
        </div>

        {/* Tabs */}
        <div className="tab-buttons">
          <button
            onClick={() => setActiveTab("rightNow")}
            className={activeTab === "rightNow" ? "active-tab" : "inactive-tab"}
          >
            🔥 Right Now
          </button>

          <button
            onClick={() => setActiveTab("planned")}
            className={activeTab === "planned" ? "active-tab" : "inactive-tab"}
          >
            📅 Planned
          </button>
        </div>

        {/* Feed */}
        <div>
          <h2 style={{ marginBottom: "16px" }}>Activity Feed</h2>

          {filteredActivities.length === 0 && (
            <div className="empty-state">
              <p>No activities found. Create one to get started!</p>
            </div>
          )}

          {filteredActivities.map((activity) => {
            const badge = getReliabilityBadge(activity.reliability);
            const expired = isExpired(activity.activity_time);

            return (
              <div
                key={activity.id}
                className={`card ${
                  isHappeningSoon(activity.activity_time) ? "happening" : ""
                }`}
              >
                {isHappeningSoon(activity.activity_time) && (
                  <span className="happening-label">🔥 Happening Soon</span>
                )}

                <div className="card-header">
                  <h3>{activity.title}</h3>
                  {activity.created_by === currentUserId && !expired && (
                    <div className="card-actions">
                      <button
                        className="edit-btn"
                        onClick={() => openEditModal(activity)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(activity.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>

                <p>{activity.description}</p>
                <p>
                  <strong>📍 Location:</strong> {activity.location}
                </p>
                <p className="creator-line">
                  <strong>👤 Created by:</strong> {activity.name}
                  <span className={`reliability-badge ${badge.className}`}>
                    {activity.reliability}% — {badge.label}
                  </span>
                </p>
                <p>🕒 {new Date(activity.activity_time).toLocaleString()}</p>

                <p
                  className="participants-toggle"
                  onClick={() => {
                    if (openActivityId === activity.id) {
                      setOpenActivityId(null);
                    } else {
                      setOpenActivityId(activity.id);
                      fetchParticipants(activity.id);
                    }
                  }}
                >
                  👥 {activity.participants_count}{" "}
                  {activity.participants_count === 1 ? "person" : "people"} joined
                  <span className="toggle-arrow">
                    {openActivityId === activity.id ? "▲" : "▼"}
                  </span>
                </p>

                {openActivityId === activity.id &&
                  participants[activity.id] && (
                    <ul className="participants">
                      {participants[activity.id].map((user) => (
                        <li key={user.id}>
                          <span className="participant-name">{user.name}</span>

                          <div className="participant-actions">
                            {user.status === "attended" && (
                              <span className="status-badge status-attended">
                                ✅ Attended
                              </span>
                            )}

                            {user.status === "no-show" && (
                              <span className="status-badge status-noshow">
                                ❌ No Show
                              </span>
                            )}

                            {activity.created_by === currentUserId &&
                              user.status === "joined" && (
                                <div className="attendance-btns">
                                  <button
                                    className="mark-attended-btn"
                                    onClick={() =>
                                      handleMarkAttendance(
                                        activity.id,
                                        user.id,
                                        "attended"
                                      )
                                    }
                                  >
                                    ✅ Attended
                                  </button>
                                  <button
                                    className="mark-noshow-btn"
                                    onClick={() =>
                                      handleMarkAttendance(
                                        activity.id,
                                        user.id,
                                        "no-show"
                                      )
                                    }
                                  >
                                    ❌ No Show
                                  </button>
                                </div>
                              )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                {/* Action Buttons */}
                <div className="card-footer">
                  {activity.created_by === currentUserId ? (
                    <span className="creator-tag">✨ You created this</span>
                  ) : activity.joined ? (
                    <button
                      className="leave-btn"
                      onClick={() => handleLeave(activity.id)}
                    >
                      Leave Activity
                    </button>
                  ) : (
                    <button
                      className="join-btn"
                      onClick={() => handleJoin(activity.id)}
                    >
                      Join Activity
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editingActivity && (
        <div className="modal-overlay" onClick={() => setEditingActivity(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Activity</h3>
              <button
                className="modal-close"
                onClick={() => setEditingActivity(null)}
              >
                ✕
              </button>
            </div>

            <input
              placeholder="Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />

            <input
              placeholder="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />

            <input
              placeholder="Select Area"
              value={editAreaInput}
              onChange={(e) => {
                const value = e.target.value;
                setEditAreaInput(value);
                setEditSelectedArea("");
                fetchEditAreas(value);
              }}
            />

            {editAreaSuggestions.length > 0 && (
              <ul className="area-suggestions">
                {editAreaSuggestions.map((area, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setEditSelectedArea(area.name);
                      setEditAreaInput(area.name);
                      setEditAreaSuggestions([]);
                    }}
                  >
                    {area.name}
                  </li>
                ))}
              </ul>
            )}

            <input
              type="datetime-local"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
            />

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setEditingActivity(null)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Dashboard;
