import { useState } from "react";
import API from "./api";

function App() {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    const res = await API.get(`/user/${username}`);
    setUser(res.data);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>GitHub Analytics</h1>

      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter GitHub username"
      />

      <button onClick={fetchUser}>Search</button>

      {user && (
        <div>
          <h2>{user.name}</h2>
          <p>Followers: {user.followers}</p>
          <p>Public Repos: {user.public_repos}</p>
        </div>
      )}
    </div>
  );
}

export default App;