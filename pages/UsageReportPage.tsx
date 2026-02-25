import React, { useMemo } from "react";
import { LectureSession, UsageReport } from "../types";
import { calculateEstimatedCost, formatCost } from "../utils/costCalculator";
import { ArrowLeft, BarChart3, Clock, Cpu, Tag, Activity } from "lucide-react";

interface UsageReportPageProps {
  session: LectureSession;
  onBack: () => void;
}

const TAG_LABELS: Record<string, string> = {
  grouping: "Topic Grouping",
  lecture_plan: "Initial Planning",
  slide_conversation: "Live Discussion",
  other: "Miscellaneous"
};

const UsageReportPage: React.FC<UsageReportPageProps> = ({ session, onBack }) => {
  const reports = session.usageReports || [];

  const stats = useMemo(() => {
    const totalCost = reports.reduce((acc, r) => acc + calculateEstimatedCost(r.modelId, r.usage), 0);
    const totalTokens = reports.reduce((acc, r) => acc + (r.usage.totalTokens || 0), 0);
    
    const byTag = reports.reduce((acc, r) => {
      const tag = r.tag || 'other';
      if (!acc[tag]) acc[tag] = { cost: 0, tokens: 0, count: 0 };
      acc[tag].cost += calculateEstimatedCost(r.modelId, r.usage);
      acc[tag].tokens += (r.usage.totalTokens || 0);
      acc[tag].count += 1;
      return acc;
    }, {} as Record<string, { cost: number; tokens: number; count: number }>);

    return { totalCost, totalTokens, byTag };
  }, [reports]);

  const getTagLabel = (tag: string) => {
    if (TAG_LABELS[tag]) return TAG_LABELS[tag];
    if (tag.startsWith('slide_conversation:')) {
      const num = tag.split(':')[1];
      return `Slide ${num} Discussion`;
    }
    return tag;
  };

  const getTagColorClass = (tag: string) => {
    if (tag === 'lecture_plan') return 'bg-purple-500/20 text-purple-400';
    if (tag === 'grouping') return 'bg-orange-500/20 text-orange-400';
    if (tag.startsWith('slide_conversation')) return 'bg-blue-500/20 text-blue-400';
    return 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-200 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              title="Back to Sessions"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-500" />
                Usage Report
              </h1>
              <p className="text-gray-400 mt-1 truncate max-w-md" title={session.fileName}>
                {session.fileName}
              </p>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-6 py-3 flex flex-col items-end">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Total Estimated Cost</span>
            <span className="text-3xl font-mono font-bold text-blue-400">
              {formatCost(stats.totalCost)}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Cpu className="h-12 w-12" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Consumption</h3>
            <div className="text-2xl font-bold text-white">{stats.totalTokens.toLocaleString()} <span className="text-sm font-normal text-gray-500">tokens</span></div>
          </div>
          
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Activity className="h-12 w-12" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total AI Interactions</h3>
            <div className="text-2xl font-bold text-white">{reports.length} <span className="text-sm font-normal text-gray-500">calls</span></div>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Clock className="h-12 w-12" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-2">Session Duration</h3>
            <div className="text-2xl font-bold text-white">
              {reports.length > 0 
                ? (() => {
                    const start = session.createdAt;
                    const end = reports[reports.length - 1].timestamp;
                    const diffMin = Math.round((end - start) / 60000);
                    return diffMin > 60 ? `${Math.floor(diffMin/60)}h ${diffMin%60}m` : `${diffMin}m`;
                  })()
                : "N/A"
              }
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Tag className="h-5 w-5 text-gray-400" />
          Consumption by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {Object.entries(stats.byTag).map(([tag, data]) => {
            const castData = data as { cost: number; tokens: number; count: number };
            return (
              <div key={tag} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2 py-1 bg-white/10 rounded text-xs font-bold uppercase text-white/70">
                    {getTagLabel(tag)}
                  </span>
                  <span className="text-blue-400 font-mono font-bold">
                    {formatCost(castData.cost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{castData.count} calls</span>
                  <span>{castData.tokens.toLocaleString()} tokens</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Turn List */}
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-400" />
          Detailed History
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Timestamp</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Model</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Tag</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-right">Tokens</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[...reports].reverse().map((report, idx) => {
                  const cost = calculateEstimatedCost(report.modelId, report.usage);
                  return (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-400 group-hover:text-blue-400 transition-colors">
                        {report.modelId}
                      </td>
                      <td className="px-6 py-4 text-sm">
                         <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight
                            ${getTagColorClass(report.tag || 'other')}`}>
                           {getTagLabel(report.tag || 'other')}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 text-right font-mono">
                        {report.usage.totalTokens?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono font-bold text-white">
                        {formatCost(cost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {reports.length === 0 && (
             <div className="p-12 text-center text-gray-500">
                No usage reports available for this session.
             </div>
          )}
        </div>

        {/* Note */}
        <p className="mt-8 text-xs text-gray-500 text-center italic">
          * Costs are estimates based on model token rates. Actual billing may vary.
        </p>
      </div>
    </div>
  );
};

export default UsageReportPage;
