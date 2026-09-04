"use client";
import React, { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://soldiers-humidity-third-owner.trycloudflare.com";

export default function Dashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [vms, setVms] = useState<any[]>([]);
  const [hosts, setHosts] = useState<any[]>([]);
  const [vmName, setVmName] = useState("");
  const [newUser, setNewUser] = useState({ name: "", pass: "" });
  const [sysLoad, setSysLoad] = useState("Loading...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = () => {
    fetchUsers();
    fetchHealth();
    fetchVMs();
    fetchHosts();
  };

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

  const fetchVMs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/vms`);
      const data = await res.json();
      if (Array.isArray(data)) setVms(data);
    } catch (e) {
      console.error("Failed fetching VMs", e);
    }
  };

  const fetchHosts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/hosts`);
      const data = await res.json();
      if (Array.isArray(data)) setHosts(data);
    } catch (e) {
      console.error("Failed fetching hosts", e);
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
      fetchVMs();
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
      {/* Top Navigation Bar */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
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
      </div>

      <div className="space-y-8">
        {/* Cluster Host Health Section */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-emerald-500/30">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">Cluster Host Nodes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hosts.length === 0 ? (
              <p className="text-gray-400 text-sm">No host node data available.</p>
            ) : (
              hosts.map((host: any) => (
                <div key={host.id} className="bg-gray-700/60 p-4 rounded-lg border border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white">{host.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded font-bold ${
                      host.state === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {host.state}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">CPU Allocation: {host.cpuUsage} / {host.maxCpu} Cores</p>
                  <p className="text-sm text-gray-300">RAM Usage: {host.memUsage} MB / {host.maxMem} MB</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Virtual Machines Table */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-cyan-500/30">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">Active Virtual Machines</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-900/80 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {vms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-400">No active virtual machines found.</td>
                  </tr>
                ) : (
                  vms.map((vm: any) => (
                    <tr key={vm.id} className="hover:bg-gray-700/40 transition">
                      <td className="p-3 font-mono">{vm.id}</td>
                      <td className="p-3 font-medium text-white">{vm.name}</td>
                      <td className="p-3">{vm.user}</td>
                      <td className="p-3 font-mono">{vm.ip}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs rounded font-bold ${
                          vm.state === 'RUNNING' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {vm.state}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Member Directory */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-purple-500/30">
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