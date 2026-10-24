import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import homePhoto from "@assets/generated_images/casa-nova-interior.jpg";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ArrowDown, ArrowUp, Check, ChevronDown, Copy, Heart, Home,
  ImagePlus, KeyRound, LoaderCircle, LockKeyhole, LogOut, Mail, MapPin,
  Pencil, Plus, Search, Settings2, Sparkles, Trash2, X,
} from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Form } from "@/components/ui/form";
import {
  useAdminGifts, useAdminSession, useAdminSettings, useDeleteGift,
  usePublicGifts, usePublicSettings, useSaveGift, useSaveSiteSettings,
  useSetGiftStatus, useSignInAdmin, useSignOutAdmin, useUploadGiftPhoto,
} from "@/lib/housewarming-api";
import type { DeliveryAddress, Gift, GiftInput, SiteSettings } from "@/lib/housewarming-types";
import { Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();
const introFallback = "Um novo lar, muitas histórias para viver e uma alegria enorme em compartilhar esse momento com vocês! Preparamos uma lista de itens para nossa casa nova e ficaremos muito felizes com o carinho de cada um.";
const pixFallback = "Se preferir, você também pode nos presentear com uma contribuição para ajudar a montar nosso novo lar. Agradecemos muito pelo carinho!";
const emptyAddress: DeliveryAddress = { postal_code: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", reference: "" };

function SiteHeader({ hosts, admin = false }: { hosts: string; admin?: boolean }) {
  return <header className="site-header"><a className="brand-mark" href="/" aria-label="Página inicial" data-testid="link-home"><span className="brand-icon"><Home size={17} strokeWidth={1.6}/></span><span><b>Casa Nova</b><small data-testid="text-hosts">{hosts || "Guilherme & Alice"}</small></span></a><nav><a href={admin ? "/" : "#presentes"} data-testid="link-primary-nav">{admin ? "Ver convite" : "Lista de presentes"}</a>{!admin && <a href="#entrega" data-testid="link-delivery-nav">Como entregar</a>}<a className="nav-admin" href="/admin" data-testid="link-admin">{admin ? "Área dos anfitriões" : "Anfitriões"}</a></nav></header>;
}

function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return <div className="loading-panel" role="status"><span className="skeleton sk-line"/><span className="skeleton sk-line short"/><span className="loading-label">{label}</span></div>;
}

function PublicPage() {
  const settingsQuery = usePublicSettings();
  const giftsQuery = usePublicGifts();
  const settings = settingsQuery.data;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas as categorias");
  const [copied, setCopied] = useState<"address" | "pix" | "">("");
  const gifts = giftsQuery.data ?? [];
  const categories = useMemo(() => Array.from(new Set(gifts.map(g => g.category?.trim()).filter((value): value is string => Boolean(value)))), [gifts]);
  const filteredGifts = gifts.filter(gift => (!search || `${gift.name} ${gift.description ?? ""} ${gift.category ?? ""}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))) && (category === "Todas as categorias" || gift.category === category));
  const heroUrl = settings?.hero_image_url || homePhoto;
  const copyValue = async (kind: "address" | "pix", value: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(kind); window.setTimeout(() => setCopied(""), 2200); } catch { setCopied(""); }
  };
  const address = settings?.delivery_address;
  const addressText = address ? [address.street, address.number, address.complement, address.neighborhood, [address.city, address.state].filter(Boolean).join(" / "), address.postal_code, address.reference && `Referência: ${address.reference}`].filter(Boolean).join(", ") : "";
  return <div className="public-page">
    <SiteHeader hosts={settings?.hosts ?? "Guilherme & Alice"}/>
    {settingsQuery.isLoading ? <div className="public-loading" data-testid="status-public-settings-loading"><LoadingState label="Preparando nosso convite"/></div> : settingsQuery.isError ? <div className="notice error-notice" data-testid="state-public-settings-error"><p>Não foi possível carregar o convite agora.</p><button className="button button-outline" data-testid="button-retry-public-settings" onClick={() => void settingsQuery.refetch()}>Tentar novamente</button></div> :
    <main>
      <section className="hero-section">
        <div className="hero-copy"><span className="eyebrow"><span className="eyebrow-line"/>UM LAR PARA CHAMAR DE NOSSO</span>
          <h1 data-testid="text-public-page-title">{settings?.page_title || "Chá de Casa Nova"}</h1>
          <p className="hero-subtitle" data-testid="text-public-page-subtitle">{settings?.page_subtitle || "Guilherme & Alice"}</p>
          <div className="intro-rule"/>
          <p className="hero-intro" data-testid="text-public-intro">{settings?.intro_text || introFallback}</p>
          {settings?.event_date && <p className="event-date" data-testid="text-public-event-date"><Sparkles size={15}/>{new Date(`${settings.event_date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>}
          <a className="button button-dark hero-cta" href="#presentes" data-testid="link-public-cta">Ver lista de presentes <span aria-hidden="true">↗</span></a>
        </div>
        <div className="hero-image-wrap"><img src={heroUrl} alt="Interior acolhedor de uma casa pronta para receber novas histórias" className="hero-image" data-testid="image-public-hero"/><div className="image-caption"><span>01 / 03</span><span>Nosso novo começo</span></div><div className="hero-stamp" aria-hidden="true">G <span>&</span> A</div></div>
      </section>
      <section className="about-section" id="sobre">
        <div className="section-index">01 <span>—</span> NOSSO ESPAÇO</div>
        <div className="about-layout"><div className="about-image-wrap"><img src={settings?.about_image_url || heroUrl} alt="Um cantinho especial do novo lar" className="about-image" data-testid="image-public-about"/><span className="image-note">um espaço, tantas possibilidades</span></div>
          <div className="about-copy"><span className="eyebrow">COM CARINHO,</span><h2 data-testid="text-public-about-title">{settings?.about_title || "Nosso novo lar"}</h2><p data-testid="text-public-about-copy">{settings?.about_text || "Estamos começando uma nova etapa e cada detalhe da casa vai ganhar um pouco da nossa história. Ter vocês por perto, mesmo em pensamento, deixa tudo ainda mais especial."}</p><div className="signature" data-testid="text-public-signature">Guilherme <span>&</span> Alice</div></div></div>
      </section>
      <section className="gift-section" id="presentes"><div className="section-index">02 <span>—</span> COM UM POUCO DE CADA UM</div>
        <div className="gift-heading"><div><span className="eyebrow">ESCOLHIDOS PARA O NOSSO DIA A DIA</span><h2>Nossa lista de presentes</h2></div><p>Cada escolha ajuda a fazer deste espaço, casa.</p></div>
        <div className="gift-tools"><label className="search-field"><Search size={17}/><input aria-label="Buscar presente" data-testid="input-public-search" placeholder="O que você procura?" value={search} onChange={e => setSearch(e.target.value)}/></label><label className="select-field"><select aria-label="Filtrar por categoria" data-testid="select-public-category" value={category} onChange={e => setCategory(e.target.value)}><option>Todas as categorias</option>{categories.map(cat => <option key={cat}>{cat}</option>)}</select><ChevronDown size={15}/></label><span className="results-count" data-testid="text-public-result-count">{filteredGifts.length} {filteredGifts.length === 1 ? "item" : "itens"}</span></div>
        {giftsQuery.isLoading ? <div className="gift-grid" data-testid="status-public-gifts-loading">{[1,2,3,4].map(i => <div className="gift-skeleton" key={i}><span/><b/><i/></div>)}</div> : giftsQuery.isError ? <div className="empty-state" data-testid="state-public-gifts-error"><h3>A lista não carregou</h3><p data-testid="text-public-gifts-error">Não conseguimos buscar os presentes neste momento.</p><button className="button button-outline" data-testid="button-retry-public-gifts" onClick={() => void giftsQuery.refetch()}>Tentar novamente</button></div> : filteredGifts.length ? <div className="gift-grid" data-testid="list-public-gifts">{filteredGifts.map(gift => <article className="gift-card" key={gift.id} data-testid={`card-gift-${gift.id}`}><div className="gift-photo">{gift.image_url ? <img src={gift.image_url} alt={gift.name} data-testid={`image-gift-${gift.id}`}/> : <div className="gift-placeholder"><Home size={26} strokeWidth={1.2}/><span>para o nosso lar</span></div>}<span className="gift-category" data-testid={`text-gift-category-${gift.id}`}>{gift.category || "Casa"}</span></div><div className="gift-card-content"><div><h3 data-testid={`text-public-gift-name-${gift.id}`}>{gift.name}</h3>{gift.description && <p data-testid={`text-public-gift-description-${gift.id}`}>{gift.description}</p>}</div>{gift.suggested_price != null && <span className="gift-price" data-testid={`text-public-gift-price-${gift.id}`}>{gift.suggested_price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>}</div></article>)}</div> : <div className="empty-state" data-testid="state-public-gifts-empty"><span className="empty-mark"><Heart size={19}/></span><h3>{gifts.length ? "Nenhum item encontrado" : "Nossa lista está sendo preparada"}</h3><p>{gifts.length ? "Tente ajustar sua busca ou categoria." : "Em breve compartilharemos algumas ideias para o nosso novo lar."}</p>{gifts.length > 0 && <button className="text-button" data-testid="button-clear-public-filters" onClick={() => { setSearch(""); setCategory("Todas as categorias"); }}>Limpar filtros</button>}</div>}
      </section>
      <section className="delivery-section" id="entrega"><div className="delivery-inner"><div className="section-index">03 <span>—</span> UM JEITO DE CHEGAR ATÉ NÓS</div><div className="delivery-grid"><div><span className="eyebrow">SE QUISER NOS VISITAR</span><h2>Como entregar seu presente</h2><p data-testid="text-delivery-intro">Se você escolher um presente físico, aqui estão as informações para a entrega no nosso novo lar.</p>{address && <div className="address-box" data-testid="address-delivery"><MapPin size={19}/><div><b>Endereço para entrega</b><p data-testid="text-public-address">{addressText}</p></div>{addressText && <button className="icon-button copy-button" data-testid="button-copy-address" aria-label="Copiar endereço" onClick={() => void copyValue("address", addressText)}>{copied === "address" ? <Check size={17}/> : <Copy size={17}/>}</button>}</div>}{copied === "address" && <span className="copy-confirm" data-testid="status-address-copied">Endereço copiado</span>}</div><div className="delivery-side"><span className="decor-number">01</span><p>O mais importante é ter você fazendo parte desse começo.</p><span className="side-rule"/></div></div></div></section>
      <section className="pix-section"><div className="pix-mark" aria-hidden="true"><span>G</span><i>&</i><span>A</span></div><div className="pix-copy"><span className="eyebrow">UM GESTO QUE VIRA LAR</span><h2>Prefere contribuir via Pix?</h2><p data-testid="text-pix-copy">{settings?.pix_text || pixFallback}</p>{settings?.pix_key ? <div className="pix-key-row"><span className="pix-key" data-testid="text-public-pix-key">{settings.pix_key}</span><button className="button button-dark" data-testid="button-copy-pix" onClick={() => void copyValue("pix", settings.pix_key)}>{copied === "pix" ? <><Check size={16}/> Copiado</> : <><Copy size={16}/> Copiar chave</>}</button></div> : <span className="pix-unavailable" data-testid="text-pix-unavailable">Chave Pix em breve</span>}{copied === "pix" && <span className="copy-confirm" data-testid="status-pix-copied">Chave Pix copiada</span>}</div></section>
      <footer className="site-footer"><a className="footer-brand" href="/" data-testid="link-footer-home"><Home size={15}/> Casa Nova</a><span data-testid="text-footer-hosts">Com carinho, Guilherme & Alice</span><a href="#inicio" data-testid="link-back-to-top" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Voltar ao início ↑</a></footer>
    </main>}
  </div>;
}

function AdminRoute() {
  const sessionQuery = useAdminSession();
  const signIn = useSignInAdmin();
  const signOut = useSignOutAdmin();
  if (sessionQuery.isLoading) return <div className="admin-page"><LoadingState label="Verificando acesso"/></div>;
  if (sessionQuery.isError) return <div className="admin-page"><div className="auth-card"><span className="auth-symbol"><Home/></span><h1>Área dos anfitriões</h1><p data-testid="status-admin-session-error">Não foi possível verificar seu acesso. Confira a conexão e tente novamente.</p><button className="button button-dark full-button" data-testid="button-retry-admin-session" onClick={() => void sessionQuery.refetch()}>Tentar novamente</button><a className="back-link" href="/" data-testid="link-session-error-home">← Voltar ao convite</a></div></div>;
  const session = sessionQuery.data;
  if (!session) return <div className="admin-page"><SiteHeader hosts="Guilherme & Alice" admin/><LoginForm signIn={signIn}/></div>;
  if (!session.isAdmin) return <div className="admin-page"><SiteHeader hosts={session.email || "Conta"}/><div className="auth-card"><span className="auth-symbol"><LockKeyhole size={22}/></span><span className="eyebrow">ACESSO NÃO AUTORIZADO</span><h1>Esta área é só dos anfitriões</h1><p data-testid="text-admin-access-denied">A conta <b>{session.email}</b> está conectada, mas não tem permissão para gerenciar esta lista.</p><button className="button button-outline full-button" data-testid="button-admin-signout-denied" onClick={() => signOut.mutate()} disabled={signOut.isPending}>{signOut.isPending ? "Saindo..." : "Sair desta conta"}</button><a className="back-link" href="/" data-testid="link-admin-denied-home">← Voltar ao convite</a></div></div>;
  return <AdminDashboard email={session.email || ""} onSignOut={() => signOut.mutate()}/>;
}

function LoginForm({ signIn }: { signIn: ReturnType<typeof useSignInAdmin> }) {
  const form = useForm<{ email: string; password: string }>({ defaultValues: { email: "", password: "" } });
  return <Form {...form}><form className="auth-card" onSubmit={form.handleSubmit(({ email, password }) => signIn.mutate({ email, password }))}><span className="auth-symbol"><LockKeyhole size={22}/></span><span className="eyebrow">ACESSO RESTRITO</span><h1>Área dos anfitriões</h1><p>Entre para cuidar dos detalhes do nosso cantinho.</p><label className="field-label">E-mail<div className="input-icon"><Mail size={17}/><input data-testid="input-admin-email" required type="email" autoComplete="email" placeholder="seu@email.com" {...form.register("email", { required: true })}/></div></label><label className="field-label">Senha<div className="input-icon"><KeyRound size={17}/><input data-testid="input-admin-password" required type="password" autoComplete="current-password" placeholder="Sua senha" {...form.register("password", { required: true })}/></div></label>{signIn.isError && <div className="form-error" role="alert" data-testid="status-admin-login-error">{signIn.error.message || "Não foi possível entrar. Confira seus dados."}</div>}<button className="button button-dark full-button" data-testid="button-admin-login" disabled={signIn.isPending}>{signIn.isPending ? <><LoaderCircle className="spin" size={16}/> Entrando...</> : "Entrar"}</button><a className="back-link" href="/" data-testid="link-back-home">← Voltar ao convite</a></form></Form>;
}

function AdminDashboard({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [tab, setTab] = useState<"gifts" | "settings">("gifts");
  const giftsQuery = useAdminGifts(true);
  const settingsQuery = useAdminSettings(true);
  const gifts = giftsQuery.data ?? [];
  const available = gifts.filter(g => g.status === "available").length;
  const fulfilled = gifts.filter(g => g.status === "fulfilled").length;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [giftModal, setGiftModal] = useState<Gift | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Gift | null>(null);
  const saveGift = useSaveGift();
  const deleteGift = useDeleteGift();
  const setStatus = useSetGiftStatus();
  const categories = Array.from(new Set(gifts.map(g => g.category?.trim()).filter((value): value is string => Boolean(value))));
  const visibleGifts = gifts.filter(g => {
    const matchesSearch = !search || `${g.name} ${g.description ?? ""} ${g.category ?? ""}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (statusFilter === "all" || g.status === statusFilter) && (categoryFilter === "all" || g.category === categoryFilter);
  });
  const moveGift = (gift: Gift, direction: number) => {
    const index = gifts.findIndex(item => item.id === gift.id);
    const other = gifts[index + direction];
    if (!other) return;
    const updatedOrder = [...gifts];
    updatedOrder[index] = { ...gift, sort_order: other.sort_order };
    updatedOrder[index + direction] = { ...other, sort_order: gift.sort_order };
    // The API accepts one gift at a time; persist each swapped display-order value.
    saveGift.mutate({ id: gift.id, input: toGiftInput(updatedOrder[index]) });
    saveGift.mutate({ id: other.id, input: toGiftInput(updatedOrder[index + direction]) });
  };
  return <div className="admin-shell"><aside className="admin-sidebar"><a className="brand-mark" href="/" data-testid="link-admin-home"><span className="brand-icon"><Home size={17}/></span><span><b>Casa Nova</b><small>Guilherme & Alice</small></span></a><span className="sidebar-label">GERENCIAR</span><button className={`side-link ${tab === "gifts" ? "active" : ""}`} data-testid="button-tab-gifts" onClick={() => setTab("gifts")}><Heart size={17}/>Lista de presentes</button><button className={`side-link ${tab === "settings" ? "active" : ""}`} data-testid="button-tab-settings" onClick={() => setTab("settings")}><Settings2 size={17}/>Informações do site</button><div className="sidebar-bottom"><span className="admin-avatar" data-testid="text-admin-initials">GA</span><div className="admin-identity"><b data-testid="text-admin-identity">{email.split("@")[0]}</b><small>Anfitrião</small></div><button className="icon-button logout-button" data-testid="button-admin-signout" onClick={onSignOut} aria-label="Sair"><LogOut size={17}/></button></div></aside>
    <main className="admin-main"><div className="admin-topbar"><div className="crumb"><a href="/" data-testid="link-admin-crumb">Casa Nova</a><span>/</span><b data-testid="text-admin-current-section">{tab === "gifts" ? "Lista de presentes" : "Informações do site"}</b></div><a className="preview-link" href="/" target="_blank" rel="noreferrer" data-testid="link-preview-site">Ver convite <span>↗</span></a></div>
      {tab === "gifts" ? <div className="admin-content"><div className="admin-title-row"><div><span className="eyebrow">SEU NOVO LAR, NO SEU TEMPO</span><h1>Lista de presentes</h1><p>Cuide dos itens que vão compor a casa de vocês.</p></div><button className="button button-dark" data-testid="button-add-gift" onClick={() => setGiftModal("new")}><Plus size={17}/> Adicionar presente</button></div>
        <div className="stat-strip"><div className="stat-item" data-testid="stat-total"><span>Total</span><b>{gifts.length}</b></div><div className="stat-item" data-testid="stat-available"><span>Disponível</span><b>{available}</b></div><div className="stat-item" data-testid="stat-fulfilled"><span>Comprados / recebidos</span><b>{fulfilled}</b></div></div>
        <div className="admin-list-panel"><div className="list-toolbar"><label className="search-field admin-search"><Search size={16}/><input aria-label="Buscar item" data-testid="input-admin-search" placeholder="Buscar presente..." value={search} onChange={e => setSearch(e.target.value)}/></label><label className="compact-select"><select aria-label="Filtrar status" data-testid="select-admin-status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">Todos os status</option><option value="available">Disponível</option><option value="fulfilled">Comprado/Recebido</option></select><ChevronDown size={14}/></label><label className="compact-select"><select aria-label="Filtrar categoria" data-testid="select-admin-category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="all">Todas as categorias</option>{categories.map(c => <option key={c}>{c}</option>)}</select><ChevronDown size={14}/></label></div>
           {giftsQuery.isLoading ? <div className="admin-skeletons" data-testid="status-admin-gifts-loading">{[1,2,3].map(n => <div className="admin-skeleton" key={n}/>)}</div> : giftsQuery.isError ? <div className="empty-state"><h3>Não foi possível carregar os itens</h3><p data-testid="status-admin-gifts-error">{giftsQuery.error.message}</p><button className="button button-outline" data-testid="button-retry-admin-gifts" onClick={() => void giftsQuery.refetch()}>Tentar novamente</button></div> : !gifts.length ? <div className="empty-state" data-testid="state-admin-gifts-empty"><span className="empty-mark"><Home size={20}/></span><h3>Comece pela primeira escolha</h3><p>Adicione um presente para montar a lista do novo lar.</p><button className="button button-dark" data-testid="button-add-first-gift" onClick={() => setGiftModal("new")}><Plus size={16}/> Adicionar presente</button></div> : !visibleGifts.length ? <div className="empty-state" data-testid="state-admin-filtered-empty"><h3>Nenhum presente encontrado</h3><p>Ajuste os filtros para ver outros itens.</p><button className="text-button" data-testid="button-clear-admin-filters" onClick={() => {setSearch("");setStatusFilter("all");setCategoryFilter("all");}}>Limpar filtros</button></div> : <div className="gift-table-wrap"><table className="gift-table"><thead><tr><th>ITEM</th><th>CATEGORIA</th><th>VALOR SUGERIDO</th><th>STATUS</th><th className="actions-head">AÇÕES</th></tr></thead><tbody>{visibleGifts.map(gift => <tr key={gift.id} data-testid={`row-gift-${gift.id}`}><td><div className="table-gift"><div className="table-thumb">{gift.image_url ? <img src={gift.image_url} alt=""/> : <Home size={17}/>}</div><div><b data-testid={`text-gift-name-${gift.id}`}>{gift.name}</b>{gift.description && <small>{gift.description}</small>}</div></div></td><td>{gift.category || <span className="muted-dash">—</span>}</td><td>{gift.suggested_price != null ? gift.suggested_price.toLocaleString("pt-BR", {style:"currency",currency:"BRL"}) : <span className="muted-dash">—</span>}</td><td><button className={`status-pill ${gift.status}`} data-testid={`button-gift-status-${gift.id}`} onClick={() => setStatus.mutate({ id: gift.id, status: gift.status === "available" ? "fulfilled" : "available" })} title="Alterar status">{gift.status === "available" ? "Disponível" : "Comprado/Recebido"}</button></td><td><div className="row-actions"><button className="icon-button" data-testid={`button-move-gift-up-${gift.id}`} aria-label={`Mover ${gift.name} para cima`} disabled={gifts[0]?.id === gift.id} onClick={() => moveGift(gift, -1)}><ArrowUp size={16}/></button><button className="icon-button" data-testid={`button-move-gift-down-${gift.id}`} aria-label={`Mover ${gift.name} para baixo`} disabled={gifts[gifts.length - 1]?.id === gift.id} onClick={() => moveGift(gift, 1)}><ArrowDown size={16}/></button><button className="icon-button" data-testid={`button-edit-gift-${gift.id}`} aria-label={`Editar ${gift.name}`} onClick={() => setGiftModal(gift)}><Pencil size={16}/></button><button className="icon-button danger-icon" data-testid={`button-delete-gift-${gift.id}`} aria-label={`Excluir ${gift.name}`} onClick={() => setDeleteTarget(gift)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>}
        </div><p className="admin-footnote">A lista pública mostra apenas presentes disponíveis.</p></div> : <SettingsEditor query={settingsQuery} />}
    </main>
    {giftModal && <GiftEditor gift={giftModal === "new" ? null : giftModal} allGifts={gifts} onClose={() => setGiftModal(null)} onSave={(input, id) => saveGift.mutate({ input, id }, { onSuccess: () => setGiftModal(null) })} saving={saveGift.isPending}/>}
    {deleteTarget && <div className="modal-backdrop" role="presentation"><div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" data-testid="dialog-delete-gift"><button className="modal-close" data-testid="button-close-delete-dialog" onClick={() => setDeleteTarget(null)} aria-label="Fechar"><X size={19}/></button><span className="delete-symbol"><Trash2 size={20}/></span><h2 id="delete-title">Excluir este presente?</h2><p data-testid="text-delete-gift-confirmation">“{deleteTarget.name}” será removido da lista. Esta ação não pode ser desfeita.</p>{deleteGift.isError && <div className="form-error" role="alert" data-testid="status-delete-gift-error">{deleteGift.error.message}</div>}<div className="modal-actions"><button className="button button-outline" data-testid="button-cancel-delete-gift" onClick={() => setDeleteTarget(null)}>Cancelar</button><button className="button button-danger" data-testid="button-confirm-delete-gift" disabled={deleteGift.isPending} onClick={() => deleteGift.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}>{deleteGift.isPending ? "Excluindo..." : "Excluir presente"}</button></div></div></div>}
  </div>;
}

function toGiftInput(gift: Gift): GiftInput {
  return { name: gift.name, description: gift.description, image_url: gift.image_url, category: gift.category, suggested_price: gift.suggested_price, sort_order: gift.sort_order };
}

interface GiftEditorValues {
  name: string;
  description: string;
  image_url: string;
  category: string;
  suggested_price: string;
  sort_order: number;
}

function GiftEditor({ gift, allGifts, onClose, onSave, saving }: { gift: Gift | null; allGifts: Gift[]; onClose: () => void; onSave: (input: GiftInput, id?: string) => void; saving: boolean }) {
  const upload = useUploadGiftPhoto();
  const form = useForm<GiftEditorValues>({ defaultValues: {
    name: gift?.name || "", description: gift?.description || "", image_url: gift?.image_url || "",
    category: gift?.category || "", suggested_price: gift?.suggested_price?.toString() || "",
    sort_order: gift?.sort_order ?? allGifts.length,
  } });
  const submit = form.handleSubmit(values => {
    const suggestedPrice = values.suggested_price.trim() ? Number(values.suggested_price.replace(",", ".")) : null;
    if (suggestedPrice !== null && (!Number.isFinite(suggestedPrice) || suggestedPrice < 0)) {
      form.setError("suggested_price", { type: "validate", message: "Informe um valor válido." });
      return;
    }
    onSave({
      name: values.name.trim(), description: values.description.trim() || null,
      image_url: values.image_url.trim() || null, category: values.category.trim() || null,
      suggested_price: suggestedPrice, sort_order: Number(values.sort_order),
    }, gift?.id);
  });
  return <div className="modal-backdrop" role="presentation"><Form {...form}><form className="editor-modal" onSubmit={submit} aria-labelledby="gift-editor-title"><div className="modal-heading"><div><span className="eyebrow">LISTA DO NOVO LAR</span><h2 id="gift-editor-title">{gift ? "Editar presente" : "Adicionar presente"}</h2></div><button type="button" className="modal-close" data-testid="button-close-gift-editor" onClick={onClose} aria-label="Fechar"><X size={19}/></button></div>
    <label className="field-label">Nome do item<input data-testid="input-gift-name" required maxLength={120} placeholder="Ex.: Jogo de pratos" {...form.register("name", { required: "Informe o nome do item." })}/></label>
    <label className="field-label">Descrição<textarea data-testid="input-gift-description" rows={3} maxLength={500} placeholder="Um detalhe sobre esse item (opcional)" {...form.register("description")}/></label>
    <div className="field-pair"><label className="field-label">Categoria<input data-testid="input-gift-category" placeholder="Ex.: Cozinha" {...form.register("category")}/></label><label className="field-label">Valor sugerido (R$)<input data-testid="input-gift-price" inputMode="decimal" placeholder="Opcional" {...form.register("suggested_price")}/>{form.formState.errors.suggested_price && <small className="form-error">{form.formState.errors.suggested_price.message}</small>}</label></div>
    <label className="field-label">Imagem do presente<div className="upload-row"><input data-testid="input-gift-image-url" placeholder="Cole o endereço da imagem" {...form.register("image_url")}/><label className="upload-button" data-testid="button-upload-gift-photo"><ImagePlus size={16}/> Enviar<input data-testid="input-upload-gift-photo" type="file" accept="image/*" hidden onChange={async e => {const file=e.target.files?.[0]; e.currentTarget.value=""; if (!file) return; try {const url=await upload.mutateAsync(file); form.setValue("image_url", url, { shouldDirty:true });} catch { /* React Query exposes upload error below. */ }}}/></label></div>{upload.isPending && <small className="helper-text" role="status" data-testid="status-gift-photo-upload">Enviando imagem...</small>}</label>
    <label className="field-label narrow-field">Ordem de exibição<input data-testid="input-gift-sort-order" type="number" min="0" step="1" {...form.register("sort_order", { valueAsNumber:true })}/></label>
    {upload.isError && <div className="form-error" role="alert" data-testid="status-gift-photo-error">{upload.error?.message || "Não foi possível enviar a imagem."}</div>}
    <div className="modal-actions"><button type="button" className="button button-outline" data-testid="button-cancel-gift" onClick={onClose}>Cancelar</button><button type="submit" className="button button-dark" data-testid="button-save-gift" disabled={saving || upload.isPending}>{saving ? "Salvando..." : gift ? "Salvar alterações" : "Adicionar à lista"}</button></div>
  </form></Form></div>;
}

function SettingsEditor({ query }: { query: ReturnType<typeof useAdminSettings> }) {
  const save = useSaveSiteSettings();
  const upload = useUploadGiftPhoto();
  const [uploadingPhoto, setUploadingPhoto] = useState<"hero" | "about" | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [saved, setSaved] = useState(false);
  const emptySettings: SiteSettings = { id:1, hosts:"", page_title:"", page_subtitle:"", intro_text:"", about_title:"", about_text:"", event_date:null, hero_image_url:null, about_image_url:null, delivery_address:emptyAddress, address_is_public:false, pix_key:"", pix_text:"", updated_at:"" };
  const form = useForm<SiteSettings>({ values: query.data ?? emptySettings });
  const settings = form.watch();
  const onUpload = async (kind: "hero" | "about", file?: File) => {
    if (!file) return;
    setUploadingPhoto(kind);
    setUploadError("");
    setSaved(false);
    try {
      const url = await upload.mutateAsync(file);
      form.setValue(kind === "hero" ? "hero_image_url" : "about_image_url", url, { shouldDirty:true, shouldTouch:true });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploadingPhoto(null);
    }
  };
  const submit = form.handleSubmit(values => {
    save.mutate({
      hosts: values.hosts, page_title: values.page_title, page_subtitle: values.page_subtitle,
      intro_text: values.intro_text, about_title: values.about_title, about_text: values.about_text,
      event_date: values.event_date || null, hero_image_url: values.hero_image_url || null,
      about_image_url: values.about_image_url || null, delivery_address: values.delivery_address,
      address_is_public: values.address_is_public, pix_key: values.pix_key, pix_text: values.pix_text,
    }, { onSuccess: () => setSaved(true) });
  });
  if (query.isLoading) return <div className="admin-content"><LoadingState label="Carregando informações do site"/></div>;
  if (query.isError) return <div className="admin-content"><div className="empty-state" data-testid="state-settings-error"><h3>Não foi possível carregar as informações</h3><p data-testid="text-settings-error">{query.error.message}</p><button className="button button-outline" data-testid="button-retry-settings" onClick={() => void query.refetch()}>Tentar novamente</button></div></div>;
  if (!query.data) return <div className="admin-content"><div className="empty-state"><h3>Informações ainda não disponíveis</h3><p>Confira a configuração do site e tente novamente.</p></div></div>;
  return <Form {...form}><form className="admin-content settings-content" onSubmit={submit}><div className="admin-title-row"><div><span className="eyebrow">PERSONALIZE O CONVITE</span><h1>Informações do site</h1><p>Conte aos convidados um pouco sobre esta nova etapa.</p></div><div className="save-actions">{saved && <span className="saved-label" role="status" data-testid="status-settings-saved"><Check size={15}/> Alterações salvas</span>}<button className="button button-dark" data-testid="button-save-settings-top" disabled={save.isPending}>{save.isPending ? "Salvando..." : "Salvar alterações"}</button></div></div>{save.isError && <div className="form-error" role="alert" data-testid="status-settings-save-error">{save.error.message}</div>}
    <section className="settings-card" data-testid="section-settings-invitation"><div className="settings-card-heading"><span className="settings-icon"><Home size={18}/></span><div><h2>O convite</h2><p>As palavras que recebem seus convidados.</p></div></div><div className="settings-fields"><label className="field-label">Anfitriões<input data-testid="input-settings-hosts" {...form.register("hosts")} /></label><div className="field-pair"><label className="field-label">Título da página<input data-testid="input-settings-title" {...form.register("page_title")} /></label><label className="field-label">Subtítulo<input data-testid="input-settings-subtitle" {...form.register("page_subtitle")} /></label></div><label className="field-label">Texto de abertura<textarea data-testid="input-settings-intro" rows={4} {...form.register("intro_text")} /></label><div className="field-pair"><label className="field-label">Título sobre o lar<input data-testid="input-settings-about-title" {...form.register("about_title")} /></label><label className="field-label">Data do evento<input data-testid="input-settings-event-date" type="date" {...form.register("event_date", { setValueAs: value => value || null })} /></label></div><label className="field-label">Sobre nosso novo lar<textarea data-testid="input-settings-about-text" rows={4} {...form.register("about_text")} /></label></div></section>
    <section className="settings-card" data-testid="section-settings-images"><div className="settings-card-heading"><span className="settings-icon"><ImagePlus size={18}/></span><div><h2>Imagens</h2><p>Envie fotos ou cole um endereço de imagem.</p></div></div><div className="settings-fields">
      <label className="field-label">Imagem principal<div className="upload-row"><input data-testid="input-settings-hero-url" placeholder="https://..." {...form.register("hero_image_url")} /><label className="upload-button" data-testid="button-upload-hero-image"><ImagePlus size={16}/> {uploadingPhoto === "hero" ? "Enviando..." : "Enviar foto"}<input data-testid="input-upload-hero-image" type="file" accept="image/*" hidden disabled={upload.isPending} onChange={e => {const file=e.currentTarget.files?.[0];e.currentTarget.value="";void onUpload("hero",file);}}/></label></div></label>
      <label className="field-label">Imagem da seção “Nosso novo lar”<div className="upload-row"><input data-testid="input-settings-about-url" placeholder="https://..." {...form.register("about_image_url")} /><label className="upload-button" data-testid="button-upload-about-image"><ImagePlus size={16}/> {uploadingPhoto === "about" ? "Enviando..." : "Enviar foto"}<input data-testid="input-upload-about-image" type="file" accept="image/*" hidden disabled={upload.isPending} onChange={e => {const file=e.currentTarget.files?.[0];e.currentTarget.value="";void onUpload("about",file);}}/></label></div></label>
      {upload.isPending && <p className="helper-text" role="status" data-testid="status-settings-photo-upload">Enviando foto do {uploadingPhoto === "hero" ? "convite" : "novo lar"}...</p>}
      {uploadError && <div className="form-error" role="alert" data-testid="status-settings-photo-upload-error">{uploadError}</div>}
      <p className="helper-text">Você pode enviar uma foto local ou manter um endereço de imagem digitado acima. Os uploads são armazenados no espaço de fotos da lista.</p>
    </div></section>
    <section className="settings-card" data-testid="section-settings-delivery"><div className="settings-card-heading"><span className="settings-icon"><MapPin size={18}/></span><div><h2>Entrega</h2><p>O endereço só aparece para convidados quando você permite.</p></div></div><div className="settings-fields"><div className="field-pair"><label className="field-label">CEP<input data-testid="input-settings-postal-code" {...form.register("delivery_address.postal_code")} /></label><label className="field-label">Rua / avenida<input data-testid="input-settings-street" {...form.register("delivery_address.street")} /></label></div><div className="field-pair"><label className="field-label">Número<input data-testid="input-settings-number" {...form.register("delivery_address.number")} /></label><label className="field-label">Complemento<input data-testid="input-settings-complement" {...form.register("delivery_address.complement")} /></label></div><div className="field-pair"><label className="field-label">Bairro<input data-testid="input-settings-neighborhood" {...form.register("delivery_address.neighborhood")} /></label><label className="field-label">Cidade<input data-testid="input-settings-city" {...form.register("delivery_address.city")} /></label></div><div className="field-pair"><label className="field-label">Estado<input data-testid="input-settings-state" {...form.register("delivery_address.state")} /></label><label className="field-label">Ponto de referência<input data-testid="input-settings-reference" {...form.register("delivery_address.reference")} /></label></div><label className="toggle-setting"><input data-testid="input-settings-address-public" type="checkbox" {...form.register("address_is_public")}/><span><b>Mostrar endereço no convite público</b><small>O endereço ficará visível para todos que acessarem a lista.</small></span></label></div></section>
    <section className="settings-card" data-testid="section-settings-pix"><div className="settings-card-heading"><span className="settings-icon"><KeyRound size={18}/></span><div><h2>Contribuição via Pix</h2><p>Uma opção para quem prefere contribuir com a montagem do lar.</p></div></div><div className="settings-fields"><label className="field-label">Chave Pix<input data-testid="input-settings-pix-key" {...form.register("pix_key")} /></label><label className="field-label">Texto da seção Pix<textarea data-testid="input-settings-pix-text" rows={3} {...form.register("pix_text")} /></label></div></section>
    <div className="bottom-save"><span>As alterações aparecem no convite após salvar.</span><button className="button button-dark" data-testid="button-save-settings-bottom" disabled={save.isPending}>{save.isPending ? "Salvando..." : "Salvar alterações"}</button></div>
  </form></Form>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={PublicPage}/><Route path="/admin" component={AdminRoute}/><Route component={NotFound}/></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router/></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>;
}

export default App;
