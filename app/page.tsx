"use client"
import React, { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://soldiers-humidity-third-owner.trycloudflare.com";

export default function Dashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [vmName, setVmName] = useState("");
  const [newUser, setNewUser] = useState({ name: "", pass: "" });
  const [sysLoad, setSysLoad] = useState("Loading...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchHealth();
    const interval = setInterval(() => {
      fetchUsers();
      fetchHealth();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (e) {
      console.error("Failed fetching users", e);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cluster-health`);
      const data = await res.json();
      setSysLoad(data.load);
    } catch (e) {
      setSysLoad("Offline");
    }
  };

  const createVM = async () => {
    if (!vmName) return alert("Please enter a VM name.");
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/vm/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: vmName, templateId: 0 })
      });
      alert("VM Provisioning Triggered!");
      setVmName("");
    } catch (e) {
      alert("Error creating VM");
    }
    setLoading(false);
  };

  const createUser = async () => {
    if (!newUser.name || !newUser.pass) return alert("Enter both username and password.");
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUser.name, password: newUser.pass })
      });
      alert("Member Account Created!");
      setNewUser({ name: "", pass: "" });
      fetchUsers();
    } catch (e) {
      alert("Error creating user account");
    }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white font-sans">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-400">OpenNebula HPC Portal</h1>
          <p className="text-gray-400 text-sm">CSC 4812 Distributed Cluster Management</p>
        </div>
        <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 text-sm">
          <span className="text-gray-400">Master Load: </span>
          <span className="text-green-400 font-mono">{sysLoad}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* VM Provisioning Card */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-blue-500/30">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Deploy Virtual Machine</h2>
          <input 
            className="w-full p-2 mb-4 bg-gray-700 rounded border border-gray-600 text-white outline-none focus:border-blue-500"
            placeholder="Instance Name (e.g., worker-vm-1)..." 
            value={vmName}
            onChange={(e) => setVmName(e.target.value)}
          />
          <button 
            disabled={loading}
            onClick={createVM} 
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 w-full py-2 rounded font-bold transition"
          >
            Launch VM Instance
          </button>
        </div>

        {/* Member Account Registration Card */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-green-500/30">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Add Member Account</h2>
          <input 
            className="w-full p-2 mb-2 bg-gray-700 rounded border border-gray-600 text-white outline-none focus:border-green-500" 
            placeholder="Username" 
            value={newUser.name}
            onChange={(e) => setNewUser({...newUser, name: e.target.value})} 
          />
          <input 
            className="w-full p-2 mb-4 bg-gray-700 rounded border border-gray-600 text-white outline-none focus:border-green-500" 
            type="password" 
            placeholder="Password" 
            value={newUser.pass}
            onChange={(e) => setNewUser({...newUser, pass: e.target.value})} 
          />
          <button 
            disabled={loading}
            onClick={createUser} 
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 w-full py-2 rounded font-bold transition"
          >
            Create Account
          </button>
        </div>

        {/* Active Member Directory */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg col-span-1 md:col-span-2 border border-purple-500/30">
          <h2 className="text-xl font-semibold mb-4 text-purple-400">Cluster Member Directory</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {users.map((u: any) => (
              <div key={u.id} className="bg-gray-700 p-3 rounded flex items-center space-x-3 border border-gray-600">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-200">{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
