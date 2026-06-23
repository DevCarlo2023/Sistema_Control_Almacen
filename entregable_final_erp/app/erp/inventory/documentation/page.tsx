'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentationTable } from '@/components/inventory/documentation-table';
import { UploadDocumentDialog } from '@/components/inventory/upload-document-dialog';
import { UnifiedAssetSearch, type UnifiedAsset } from '@/components/inventory/unified-asset-search';
import { cn } from '@/lib/utils';
import { FileText, ShieldCheck, Settings, Package, Wrench, Search, FolderOpen, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

import { Suspense } from 'react';

export default function DocumentationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    }>
      <DocumentationContent />
    </Suspense>
  );
}

function DocumentationContent() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Selection State
  const [selectedAsset, setSelectedAsset] = useState<UnifiedAsset | null>(null);

  const handleRefresh = () => setRefreshTrigger(p => p + 1);

  // Sync with URL params
  useEffect(() => {
    const assetId = searchParams.get('asset_id');
    const assetType = searchParams.get('type') as 'material' | 'equipment';
    
    if (assetId && assetType) {
      const fetchAssetInfo = async () => {
        const table = assetType === 'material' ? 'materials' : 'equipment';
        const { data }: any = await supabase.from(table).select('*').eq('id', assetId).single();
        if (data) {
          setSelectedAsset({
            id: data.id,
            name: data.name,
            type: assetType,
            subtitle: assetType === 'material' ? data.description : `S/N: ${data.serial_number || 'S/S'}`,
            extra: assetType === 'equipment' ? data.brand : undefined,
          });
        }
      };
      fetchAssetInfo();
    } else {
      setSelectedAsset(null);
    }
  }, [searchParams]);

  const handleSelectAsset = (asset: UnifiedAsset | null) => {
    if (asset) {
      const params = new URLSearchParams(searchParams);
      params.set('asset_id', asset.id);
      params.set('type', asset.type);
      router.push(`/erp/inventory/documentation?${params.toString()}`);
    } else {
      router.push('/erp/inventory/documentation');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/50 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
            OPERATIONAL CONTROL · ASSET DOCUMENTATION
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-950 dark:text-white tracking-tighter uppercase leading-none">
            Centro de <span className="text-primary italic">Documentación</span>
          </h1>
          <p className="text-xs text-zinc-500 font-medium italic">Gestión de expedientes digitales, certificados y fichas técnicas por activo.</p>
        </div>
        
        <div className="flex items-center gap-3 self-start sm:self-auto relative z-10">
          <UploadDocumentDialog 
            onSuccess={handleRefresh} 
            defaultLinkedType={selectedAsset?.type}
            defaultLinkedId={selectedAsset?.id}
            defaultTitle={selectedAsset ? `DOC: ${selectedAsset.name}` : undefined}
          />
        </div>

        {/* Decorative background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
      </div>

      {/* ── Unified Asset Search ── */}
      <div className="py-2">
        <UnifiedAssetSearch 
          selectedAsset={selectedAsset}
          onSelect={handleSelectAsset}
        />
      </div>

      {selectedAsset ? (
        /* ── ASSET MODE: Digital Folder View ── */
        <div className="space-y-6 animate-in zoom-in-95 slide-in-from-top-4 duration-500">
          <Card className="overflow-hidden border-2 border-zinc-950 shadow-2xl rounded-3xl bg-white relative">
            {/* Folder tab effect */}
            <div className="absolute top-0 left-8 h-2 w-32 bg-zinc-950 rounded-b-lg z-20" />
            
            <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-50/50">
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl transition-transform hover:scale-105",
                  selectedAsset.type === 'material' ? "bg-primary text-white" : "bg-cyan-600 text-white"
                )}>
                  {selectedAsset.type === 'material' ? <Package className="w-8 h-8" /> : <Wrench className="w-8 h-8" />}
                </div>
                <div className="space-y-1">
                   <div className="flex items-center gap-3">
                      <h3 className="text-xl md:text-2xl font-black uppercase text-zinc-900 tracking-tight leading-none">
                        {selectedAsset.name}
                      </h3>
                      <span className={cn(
                        "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest text-white shadow-sm",
                        selectedAsset.type === 'material' ? "bg-primary" : "bg-cyan-600"
                      )}>
                        {selectedAsset.type === 'material' ? 'Material' : 'Equipo'}
                      </span>
                   </div>
                   <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest italic opacity-80">
                     {selectedAsset.subtitle} {selectedAsset.extra ? `· ${selectedAsset.extra}` : ''}
                   </p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSelectAsset(null)}
                className="rounded-xl font-black text-[9px] uppercase tracking-[0.2em] gap-3 px-5 h-11 border-2 border-zinc-200 hover:border-zinc-900 hover:bg-zinc-950 hover:text-white transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Volver al Listado General
              </Button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-2 h-6 bg-primary rounded-full" />
                 <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Expediente Digital del Activo</h2>
              </div>
              <DocumentationTable 
                category="Todos" 
                refreshTrigger={refreshTrigger} 
                linkedId={selectedAsset.id} 
              />
            </div>
          </Card>
        </div>
      ) : (
        /* ── GENERAL MODE: Category Tabs ── */
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* ── Summary Stats ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: 'Certificados', icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary/5', desc: 'Control de Calidad' },
              { label: 'Fichas Técnicas', icon: FileText, color: 'text-zinc-600', bg: 'bg-zinc-50', desc: 'Especificaciones' },
              { label: 'Seguridad (SDS)', icon: ShieldCheck, color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Protocolos HSEQ' }
            ].map((stat) => (
              <div key={stat.label} className={cn("p-6 rounded-3xl border border-zinc-100 flex items-center gap-5 group transition-all hover:shadow-2xl hover:shadow-zinc-200/50 hover:-translate-y-2 bg-white relative overflow-hidden")}>
                {/* Subtle background icon */}
                <stat.icon className="absolute -right-4 -bottom-4 w-24 h-24 text-zinc-50/50 group-hover:text-zinc-100/50 transition-colors pointer-events-none" />
                
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm", stat.bg)}>
                  <stat.icon className={cn("w-7 h-7", stat.color)} />
                </div>
                <div className="relative z-10">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] leading-none mb-1.5">{stat.label}</p>
                  <p className="text-xl font-black text-zinc-900 tracking-tighter mb-0.5">Sincronizado</p>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest italic">{stat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Main Content ── */}
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 md:p-8 shadow-xl shadow-zinc-100/30">
            <Tabs defaultValue="Todos" className="space-y-8">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <TabsList className="bg-zinc-100/80 border border-zinc-200 p-1.5 rounded-2xl h-auto flex flex-wrap gap-1 w-full xl:w-auto">
                  {[
                    { value: 'Todos', label: 'Ver Todo', icon: Search },
                    { value: 'Certificado de Calidad', label: 'Calidad', icon: ShieldCheck },
                    { value: 'Ficha Técnica', label: 'Técnica', icon: Wrench },
                    { value: 'Ficha de Seguridad', label: 'Seguridad (SDS)', icon: ShieldCheck },
                    { value: 'Otro', label: 'Otros', icon: Settings },
                  ].map(tab => (
                    <TabsTrigger 
                      key={tab.value}
                      value={tab.value} 
                      className={cn(
                        "flex-1 xl:flex-initial px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        "data-[state=active]:bg-zinc-900 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:-translate-y-0.5"
                      )}
                    >
                      <tab.icon className="w-3.5 h-3.5 mr-2 hidden sm:inline-block" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <div className="flex items-center gap-5 bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-3 shadow-2xl">
                   <div className="flex items-center gap-2.5">
                     <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Archivo Central Activo</span>
                   </div>
                   <div className="w-px h-5 bg-zinc-800" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nodo: Cluster-X1</span>
                </div>
              </div>

              {[
                'Todos', 
                'Certificado de Calidad', 
                'Ficha Técnica', 
                'Ficha de Seguridad', 
                'Otro'
              ].map(category => (
                <TabsContent key={category} value={category} className="mt-0 focus-visible:outline-none animate-in fade-in zoom-in-95 duration-500">
                   <div className="min-h-[400px]">
                      <DocumentationTable category={category} refreshTrigger={refreshTrigger} />
                   </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      )}

      {/* ── Quick Navigate ── */}
      <div className="pt-10 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-all duration-500">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Button variant="ghost" className="group flex items-center gap-3 text-zinc-500 hover:text-primary transition-all p-0 h-auto" onClick={() => router.push('/erp/inventory/materials')}>
             <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <Package className="w-4 h-4" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Materiales de Almacén</span>
          </Button>
          <div className="w-px h-4 bg-zinc-200 hidden md:block" />
          <Button variant="ghost" className="group flex items-center gap-3 text-zinc-500 hover:text-cyan-600 transition-all p-0 h-auto" onClick={() => router.push('/erp/inventory/equipment')}>
             <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-all">
                <Wrench className="w-4 h-4" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Activos de Maquinaria</span>
          </Button>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] bg-zinc-50 px-4 py-2 rounded-full border border-zinc-100 shadow-inner">
           Archivo Digital Verificado · 2026 ERP SUITE
        </div>
      </div>
    </div>
  );
}
