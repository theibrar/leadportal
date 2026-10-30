import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Script from 'next/script';

export default async function HostedEmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ webhookToken: string }>;
  searchParams: Promise<{ mode?: string; title?: string }>;
}) {
  const { webhookToken } = await params;
  const sParams = await searchParams;

  const assignment = await prisma.clientCampaign.findUnique({
    where: { webhookToken },
    include: {
      client: true,
      campaign: true,
    },
  });

  if (!assignment || !assignment.isActive) {
    notFound();
  }

  const mode = sParams.mode || 'multistep';
  const customTitle = sParams.title || `${assignment.campaign.name} Inquiry`;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 to-indigo-500/20 blur-[130px] pointer-events-none rounded-full" />
      
      {/* Top Banner */}
      <div className="z-10 mb-6 text-center space-y-1 max-w-md">
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
          Official Lead Submission Portal
        </span>
        <h1 className="text-xl font-black text-white tracking-tight">{assignment.client.name}</h1>
        <p className="text-xs text-slate-400 font-medium">{assignment.campaign.name}</p>
      </div>

      {/* Widget Container */}
      <div id="leadflow-hosted-container" className="z-10 w-full max-w-md"></div>

      {/* Footer Branding */}
      <div className="z-10 mt-6 text-center">
        <p className="text-[11px] text-slate-400 font-medium">
          Secured by <span className="text-blue-400 font-bold">IbraSoft LeadFlow v1.0.2</span>
        </p>
      </div>

      {/* Inject LeadForm Script */}
      <Script
        src="/embed/leadform.js"
        data-token={webhookToken}
        data-mode={mode}
        data-title={customTitle}
        data-subtitle="Please submit your details below to connect directly with our specialist."
        data-button="Confirm & Submit"
        data-container-id="leadflow-hosted-container"
        strategy="afterInteractive"
      />
    </div>
  );
}
