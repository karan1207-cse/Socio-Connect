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

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/activities", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTitle("");
      setDescription("");
      setActivityTime("");
      setSelectedArea("");
      setAreaInput("");
      await fetchActivities();
      alert("Activity created successfully.");
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
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchActivities();
      if (openActivityId === activityId) {
        fetchParticipants(activityId);
      }
    } catch (err) {
      console.error("Error leaving activity:", err);
    }
  };

  const isHappeningSoon = (time) => {
    const now = new Date();
    const activityTime = new Date(time);
    const diff = activityTime - now;
    const twoHours = 2* 60 * 60 * 1000;
    return diff > 0 && diff <= twoHours;
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <>
      <div className="navbar">
        <h2>Socio-Connect</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="dashboard-container">
        <div className="create-section">
          <h3>Create Activity</h3>

          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            placeholder="Select Area"
            value={areaInput}
            onChange={(e) => {
              const value = e.target.value;
              setAreaInput(value);
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

          <button className="join-btn" onClick={handleCreate}>
            Create
          </button>
        </div>

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

        <div>
          <h2>Activity Feed</h2>

          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className={`card ${
                isHappeningSoon(activity.activity_time) ? "happening" : ""
              }`}
            >
              {isHappeningSoon(activity.activity_time) && (
                <p className="happening-label">🔥 Happening Soon</p>
              )}

              <h3>{activity.title}</h3>
              <p>{activity.description}</p>
              <p>
                <strong>Location:</strong> {activity.location}
              </p>
              <p>
                <strong>Created by:</strong> {activity.name}
              </p>
              <p>
  <strong>Creator Reliability:</strong> {activity.reliability}%
</p>
              <p>🕒 {new Date(activity.activity_time).toLocaleString()}</p>

              <p
                style={{ cursor: "pointer", color: "blue" }}
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
              </p>

              {openActivityId === activity.id &&
                participants[activity.id] && (
<ul className="participants">
  {participants[activity.id].map((user) => (
    <li key={user.id}>
      {user.name}

      {user.status === "attended" && (
        <span style={{ color: "green", marginLeft: "10px" }}>
          ✅ Attended
        </span>
      )}

      {user.status === "no-show" && (
        <span style={{ color: "red", marginLeft: "10px" }}>
          ❌ No Show
        </span>
      )}

      {activity.created_by === currentUserId &&
        user.status === "joined" && (
          <>
            <button
              style={{ marginLeft: "10px" }}
              onClick={() =>
                handleMarkAttendance(activity.id, user.id, "attended")
              }
            >
              Mark Attended
            </button>

            <button
              style={{
                marginLeft: "5px",
                backgroundColor: "red",
                color: "white",
              }}
              onClick={() =>
                handleMarkAttendance(activity.id, user.id, "no-show")
              }
            >
              Mark No Show
            </button>
          </>
        )}
    </li>
  ))}
</ul>
                )}

              {activity.created_by === currentUserId ? (
                <p style={{ color: "green" }}>You created this activity</p>
              ) : activity.joined ? (
                <button
                  className="leave-btn"
                  onClick={() => handleLeave(activity.id)}
                >
                  Leave
                </button>
              ) : (
                <button
                  className="join-btn"
                  onClick={() => handleJoin(activity.id)}
                >
                  Join
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
