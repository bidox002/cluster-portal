"use client";
import React, { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://soldiers-humidity-third-owner.trycloudflare.com";

export default function Dashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [vms, setVms] = useState<any[]>([]);
  const [hosts, setHosts] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [sysLoad, setSysLoad] = useState("Loading...");
  
  const [vmName, setVmName] = useState("");
  const [newUser, setNewUser] = useState({ name: "", pass: "" });
  const [jobCode, setJobCode] = useState("from mpi4py import MPI\ncomm = MPI.COMM_WORLD\nprint(f'Hello from rank {comm.Get_rank()} of {comm.Get_size()}')");
  const [jobSlots, setJobSlots] = useState(2);
  const [jobOutput, setJobOutput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 6000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = () => {
    fetch(`${API_BASE}/api/users`).then(r => r.json()).then(d => Array.isArray(d) && setUsers(d)).catch(() => {});
    fetch(`${API_BASE}/api/vms`).then(r => r.json()).then(d => Array.isArray(d) && setVms(d)).catch(() => {});
    fetch(`${API_BASE}/api/hosts`).then(r => r.json()).then(d => Array.isArray(d) && setHosts(d)).catch(() => {});
    fetch(`${API_BASE}/api/logs`).then(r => r.json()).then(d => Array.isArray(d) && setLogs(d)).catch(() => {});
    fetch(`${API_BASE}/api/cluster-health`).then(r => r.json()).then(d => setSysLoad(d.load)).catch(() => setSysLoad("Offline"));
  };

  const createVM = async () => {
    if (!vmName) return;
    setLoading(true);
    await fetch(`${API_BASE}/api/vm/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: vmName })
    });
    setVmName("");
    fetchAll();
    setLoading(false);
  };

  const createUser = async () => {
    if (!newUser.name || !newUser.pass) return;
    setLoading(true);
    await fetch(`${API_BASE}/api/users/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUser.name, password: newUser.pass })
    });
    setNewUser({ name: "", pass: "" });
    fetchAll();
    setLoading(false);
  };

  const deleteUser = async (id: number, name: string) => {
    if (!confirm(`Revoke account for ${name}?`)) return;
    await fetch(`${API_BASE}/api/users/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name })
    });
    fetchAll();
  };

  const vmAction = async (id: number, action: string) => {
    if (!confirm(`Execute ${action} on VM #${id}?`)) return;
    await fetch(`${API_BASE}/api/vm/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action })
    });
    fetchAll();
  };

  const submitJob = async () => {
    setLoading(true);
    setJobOutput("Executing job across MPI ranks...");
    try {
      const res = await fetch(`${API_BASE}/api/jobs/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: jobCode, slots: jobSlots })
      });
      const data = await res.json();
      setJobOutput(data.output || data.error);
    } catch (e) {
      setJobOutput("Failed to communicate with job scheduler.");
    }
    fetchAll();
    setLoading(false);
  };

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-slate-100 font-sans space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-400">OpenNebula HPC Portal</h1>
          <p className="text-slate-400 text-sm">CSC 4812 Distributed Infrastructure</p>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-sm font-mono">
          <span className="text-slate-400">Master Load: </span>
          <span className="text-emerald-400">{sysLoad}</span>
        </div>
      </div>

      {/* Control Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-800 p-6 rounded-xl border border-blue-500/30">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Deploy Virtual Machine</h2>
          <input className="w-full p-2 mb-4 bg-slate-700 rounded border border-slate-600 outline-none" placeholder="VM Name..." value={vmName} onChange={e => setVmName(e.target.value)}/>
          <button disabled={loading} onClick={createVM} className="bg-blue-600 hover:bg-blue-700 w-full py-2 rounded font-bold transition">Launch Instance</button>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-emerald-500/30">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">Add Member Account</h2>
          <input className="w-full p-2 mb-2 bg-slate-700 rounded border border-slate-600 outline-none" placeholder="Username" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}/>
          <input className="w-full p-2 mb-4 bg-slate-700 rounded border border-slate-600 outline-none" type="password" placeholder="Password" value={newUser.pass} onChange={e => setNewUser({...newUser, pass: e.target.value})}/>
          <button disabled={loading} onClick={createUser} className="bg-emerald-600 hover:bg-emerald-700 w-full py-2 rounded font-bold transition">Create Account</button>
        </div>
      </div>

      {/* HPC Parallel Execution Module */}
      <div className="bg-slate-800 p-6 rounded-xl border border-indigo-500/30 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-indigo-400">HPC Parallel Job Scheduler (MPICH)</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400">CPU Slots:</span>
            <input type="number" min="1" max="16" value={jobSlots} onChange={e => setJobSlots(Number(e.target.value))} className="w-16 p-1 bg-slate-700 rounded border border-slate-600 text-center font-mono"/>
          </div>
        </div>
        <textarea rows={4} value={jobCode} onChange={e => setJobCode(e.target.value)} className="w-full p-3 bg-slate-950 font-mono text-sm text-emerald-300 rounded border border-slate-700 outline-none"/>
        <button disabled={loading} onClick={submitJob} className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded font-bold transition">Dispatch Job</button>
        {jobOutput && (
          <pre className="p-4 bg-slate-950 rounded border border-slate-700 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">{jobOutput}</pre>
        )}
      </div>

      {/* Host Nodes Health */}
      <div className="bg-slate-800 p-6 rounded-xl border border-teal-500/30">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Cluster Host Nodes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hosts.map((h: any) => (
            <div key={h.id} className="bg-slate-700/50 p-4 rounded border border-slate-600">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">{h.name}</span>
                <span className={`px-2 py-0.5 text-xs rounded font-bold ${h.state === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{h.state}</span>
              </div>
              <p className="text-sm text-slate-300">CPU Allocation: {h.cpuUsage} / {h.maxCpu} Cores</p>
              <p className="text-sm text-slate-300">RAM Allocation: {h.memUsage} MB / {h.maxMem} MB</p>
            </div>
          ))}
        </div>
      </div>

      {/* Virtual Machine Table */}
      <div className="bg-slate-800 p-6 rounded-xl border border-cyan-500/30">
        <h2 className="text-xl font-semibold mb-4 text-cyan-400">Active Virtual Machines</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Owner</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {vms.map((vm: any) => (
                <tr key={vm.id} className="hover:bg-slate-700/40">
                  <td className="p-3 font-mono">{vm.id}</td>
                  <td className="p-3 font-medium text-white">{vm.name}</td>
                  <td className="p-3">{vm.user}</td>
                  <td className="p-3 font-mono">{vm.ip}</td>
                  <td className="p-3"><span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded font-bold">{vm.state}</span></td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => vmAction(vm.id, 'reboot')} className="px-2 py-1 bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 text-xs rounded">Reboot</button>
                    <button onClick={() => vmAction(vm.id, 'poweroff')} className="px-2 py-1 bg-orange-600/20 text-orange-400 border border-orange-500/30 text-xs rounded">Power Off</button>
                    <button onClick={() => vmAction(vm.id, 'terminate')} className="px-2 py-1 bg-red-600/20 text-red-400 border border-red-500/30 text-xs rounded">Terminate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Directory & Audit Stream Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-slate-800 p-6 rounded-xl border border-purple-500/30">
          <h2 className="text-xl font-semibold mb-4 text-purple-400">Cluster Member Directory</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((u: any) => (
              <div key={u.id} className="bg-slate-700 p-3 rounded flex justify-between items-center border border-slate-600">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-slate-200">{u.name}</p>
                    <p className="text-xs text-slate-400">Group: {u.group || 'users'}</p>
                  </div>
                </div>
                {u.name !== 'oneadmin' && (
                  <button onClick={() => deleteUser(u.id, u.name)} className="text-xs text-red-400 hover:text-red-300 font-bold">Revoke</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-amber-500/30">
          <h2 className="text-xl font-semibold mb-4 text-amber-400">Real-time Audit Log</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-xs text-slate-300">
            {logs.map((log, i) => (
              <div key={i} className="p-2 bg-slate-900 rounded border border-slate-700/50">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}