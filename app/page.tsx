"use client";
import React, { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://offline-science-rugs-married.trycloudflare.com";

const SCRIPT_PRESETS: Record<string, string> = {
  hello: "from mpi4py import MPI\ncomm = MPI.COMM_WORLD\nprint(f'Hello from rank {comm.Get_rank()} of {comm.Get_size()}')",
  pi: "from mpi4py import MPI\nimport random\n\ncomm = MPI.COMM_WORLD\nrank = comm.Get_rank()\nsize = comm.Get_size()\nN = 500000\n\ninside = sum(1 for _ in range(N // size) if random.random()**2 + random.random()**2 <= 1.0)\ntotal_inside = comm.reduce(inside, op=MPI.SUM, root=0)\n\nif rank == 0:\n    pi = 4.0 * total_inside / N\n    print(f'Monte Carlo Pi estimation across {size} ranks: {pi}')",
  prime: "from mpi4py import MPI\n\ncomm = MPI.COMM_WORLD\nrank = comm.Get_rank()\nsize = comm.Get_size()\n\ndef is_prime(n):\n    return n > 1 and all(n % i != 0 for i in range(2, int(n**0.5) + 1))\n\nlimit = 200\nprimes = [n for n in range(2 + rank, limit, size) if is_prime(n)]\nall_primes = comm.gather(primes, root=0)\n\nif rank == 0:\n    flat = sorted([p for sub in all_primes for p in sub])\n    print(f'Parallel Prime Sieve up to {limit}: {flat}')"
};

export default function Dashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [vms, setVms] = useState<any[]>([]);
  const [hosts, setHosts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [datastores, setDatastores] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [sysLoad, setSysLoad] = useState("Loading...");
  
  const [vmName, setVmName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [newUser, setNewUser] = useState({ name: "", pass: "" });
  const [jobCode, setJobCode] = useState(SCRIPT_PRESETS.hello);
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
    fetch(`${API_BASE}/api/templates`).then(r => r.json()).then(d => Array.isArray(d) && setTemplates(d)).catch(() => {});
    fetch(`${API_BASE}/api/datastores`).then(r => r.json()).then(d => Array.isArray(d) && setDatastores(d)).catch(() => {});
    fetch(`${API_BASE}/api/logs`).then(r => r.json()).then(d => Array.isArray(d) && setLogs(d)).catch(() => {});
    fetch(`${API_BASE}/api/cluster-health`).then(r => r.json()).then(d => setSysLoad(d.load)).catch(() => setSysLoad("Offline"));
  };

  const createVM = async () => {
    if (!vmName) return;
    setLoading(true);
    await fetch(`${API_BASE}/api/vm/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: vmName, templateId: selectedTemplate })
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
      if (!res.ok) {
        setJobOutput(`Execution Error: ${data.error || 'Server error'}`);
      } else {
        setJobOutput(data.output || 'Job completed with no output.');
      }
    } catch (e: any) {
      setJobOutput(`Network Error: ${e.message}`);
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
        <div className="bg-slate-800 p-6 rounded-xl border border-blue-500/30 space-y-3">
          <h2 className="text-xl font-semibold text-blue-400">Deploy Virtual Machine</h2>
          <input className="w-full p-2 bg-slate-700 rounded border border-slate-600 outline-none text-sm" placeholder="VM Name..." value={vmName} onChange={e => setVmName(e.target.value)}/>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Template:</span>
            <select value={selectedTemplate} onChange={e => setSelectedTemplate(Number(e.target.value))} className="w-full p-2 bg-slate-700 rounded border border-slate-600 text-sm text-slate-200 outline-none">
              <option value={0}>Default Template (ID: 0)</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} (ID: {t.id})</option>
              ))}
            </select>
          </div>
          <button disabled={loading} onClick={createVM} className="bg-blue-600 hover:bg-blue-700 w-full py-2 rounded font-bold transition text-sm">Launch Instance</button>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-emerald-500/30 space-y-2">
          <h2 className="text-xl font-semibold text-emerald-400">Add Member Account</h2>
          <input className="w-full p-2 bg-slate-700 rounded border border-slate-600 outline-none text-sm" placeholder="Username" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}/>
          <input className="w-full p-2 bg-slate-700 rounded border border-slate-600 outline-none text-sm" type="password" placeholder="Password" value={newUser.pass} onChange={e => setNewUser({...newUser, pass: e.target.value})}/>
          <button disabled={loading} onClick={createUser} className="bg-emerald-600 hover:bg-emerald-700 w-full py-2 rounded font-bold transition text-sm">Create Account</button>
        </div>
      </div>

      {/* HPC Parallel Execution Module */}
      <div className="bg-slate-800 p-6 rounded-xl border border-indigo-500/30 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-xl font-semibold text-indigo-400">HPC Parallel Job Scheduler (MPICH)</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Preset Code:</span>
              <select onChange={e => setJobCode(SCRIPT_PRESETS[e.target.value])} className="bg-slate-700 text-xs text-slate-200 p-1.5 rounded border border-slate-600 outline-none">
                <option value="hello">Hello Ranks</option>
                <option value="pi">Monte Carlo Pi Estimation</option>
                <option value="prime">Parallel Prime Sieve</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">CPU Slots:</span>
              <input type="number" min="1" max="16" value={jobSlots} onChange={e => setJobSlots(Number(e.target.value))} className="w-14 p-1 bg-slate-700 rounded border border-slate-600 text-center font-mono text-sm"/>
            </div>
          </div>
        </div>
        <textarea rows={5} value={jobCode} onChange={e => setJobCode(e.target.value)} className="w-full p-3 bg-slate-950 font-mono text-xs text-emerald-300 rounded border border-slate-700 outline-none"/>
        <button disabled={loading} onClick={submitJob} className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded font-bold transition text-sm">Dispatch Job</button>
        {jobOutput && (
          <pre className="p-4 bg-slate-950 rounded border border-slate-700 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">{jobOutput}</pre>
        )}
      </div>

      {/* Host Nodes Health & Datastores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-slate-800 p-6 rounded-xl border border-teal-500/30">
          <h2 className="text-xl font-semibold mb-4 text-teal-400">Cluster Compute Hosts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hosts.map((h: any) => (
              <div key={h.id} className="bg-slate-700/50 p-4 rounded border border-slate-600">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">{h.name}</span>
                  <span className={`px-2 py-0.5 text-xs rounded font-bold ${h.state === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>{h.state}</span>
                </div>
                <p className="text-xs text-slate-300">CPU Allocation: {h.cpuUsage} / {h.maxCpu} Cores</p>
                <p className="text-xs text-slate-300">RAM Allocation: {h.memUsage} MB / {h.maxMem} MB</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-cyan-500/30 space-y-3">
          <h2 className="text-xl font-semibold text-cyan-400">NFS Shared Datastores</h2>
          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
            {datastores.map((ds: any) => (
              <div key={ds.id} className="bg-slate-700/40 p-3 rounded border border-slate-600/60 space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-200">
                  <span>{ds.name}</span>
                  <span className="font-mono text-slate-400">{Math.round(ds.usedMb / 1024)}GB / {Math.round(ds.totalMb / 1024)}GB</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2">
                  <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${Math.min(100, Math.round((ds.usedMb / (ds.totalMb || 1)) * 100))}%` }}></div>
                </div>
              </div>
            ))}
          </div>
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
                  <td className="p-3"><span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded font-bold border border-blue-500/30">{vm.state}</span></td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => vmAction(vm.id, 'reboot')} className="px-2 py-1 bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 text-xs rounded hover:bg-yellow-600/40 transition">Reboot</button>
                    <button onClick={() => vmAction(vm.id, 'poweroff')} className="px-2 py-1 bg-orange-600/20 text-orange-400 border border-orange-500/30 text-xs rounded hover:bg-orange-600/40 transition">Power Off</button>
                    <button onClick={() => vmAction(vm.id, 'terminate')} className="px-2 py-1 bg-red-600/20 text-red-400 border border-red-500/30 text-xs rounded hover:bg-red-600/40 transition">Terminate</button>
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