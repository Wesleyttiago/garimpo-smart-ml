// Pure functions shared by the n8n Code node and local validation.
export function normalizarAnuncios(records, options = {}) {
  if (!Array.isArray(records)) throw new Error('A saída do coletor deve ser uma lista.');
  const collectedAt = options.coletadoEm || new Date().toISOString();
  const clock = Date.parse(collectedAt);
  if (!Number.isFinite(clock)) throw new Error('Data de coleta inválida.');
  const productId = options.produtoId || 'mini-mop';
  const fold = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const text = value => typeof value === 'string' ? value : String(value?.text ?? '');
  const matches = value => {
    const haystack = fold(value);
    if (productId === 'mini-mop') return /\bmini[\s_-]*mop\b/.test(haystack);
    if (productId === 'dispenser-pasta') return /\b(dispenser|dispensador)\b/.test(haystack) && /\b(pasta|dent[ea])\b/.test(haystack);
    if (productId === 'mini-processador') return /\bmini[\s_-]*(processador|triturador)\b/.test(haystack);
    throw new Error('Produto fora da lista do piloto.');
  };
  const safeUrl = value => /^https?:\/\//i.test(String(value || '')) ? String(value) : null;
  const date = (iso, epoch) => {
    const value = iso ? Date.parse(iso) : Number.isFinite(epoch) && epoch > 0 ? epoch * 1000 : NaN;
    return Number.isFinite(value) && value <= clock ? new Date(value).toISOString() : null;
  };
  const seen = new Set();
  const candidates = [];
  const rejected = [];
  let duplicateCount = 0;
  for (const record of records) {
    if (!record || typeof record !== 'object') throw new Error('Item inválido na saída.');
    const id = String(record.adArchiveId || record.adArchiveID || record.ad_archive_id || '');
    const publisher = record.pageName || record.snapshot?.pageName || null;
    if (!/^\d+$/.test(id)) {
      rejected.push({anuncioId: null, anunciante: publisher, motivo: 'ID de anúncio ausente ou inválido'});
      continue;
    }
    if (seen.has(id)) { duplicateCount++; continue; }
    seen.add(id);
    const snapshot = record.snapshot || {};
    const cards = Array.isArray(snapshot.cards) ? snapshot.cards : [];
    // Check each card separately: a catalog containing "Mini ar" and a floor
    // mop on different cards must not match the portable mini mop.
    const relevantCards = cards.filter(card => matches([card.title, text(card.body), card.linkUrl].join(' ')));
    const mainText = [snapshot.title, text(snapshot.body), snapshot.linkUrl].join(' ');
    if (!matches(mainText) && relevantCards.length === 0) {
      rejected.push({anuncioId: id, anunciante: publisher, motivo: 'Produto não corresponde ao piloto'});
      continue;
    }
    if (record.isActive === false) {
      rejected.push({anuncioId: id, anunciante: publisher, motivo: 'Anúncio informado como inativo'});
      continue;
    }
    const body = text(snapshot.body) || text(relevantCards[0]?.body);
    const videos = [...(Array.isArray(snapshot.videos) ? snapshot.videos : []), ...relevantCards];
    const images = [...(Array.isArray(snapshot.images) ? snapshot.images : []), ...relevantCards];
    const videoUrl = videos.map(video => safeUrl(video.videoHdUrl || video.videoSdUrl)).find(Boolean) || null;
    const imageUrl = images.map(image => safeUrl(image.originalImageUrl || image.resizedImageUrl || image.videoPreviewImageUrl)).find(Boolean) || null;
    const startedAt = date(record.startDateFormatted, record.startDate);
    const age = startedAt ? Math.floor((clock - Date.parse(startedAt)) / 86400000) : null;
    const cta = snapshot.ctaText || relevantCards[0]?.ctaText || null;
    const reasons = ['Correspondência textual com o produto (+4)'];
    let priority = 4;
    if (record.isActive === true) { priority += 1; reasons.push('Informado como ativo (+1)'); }
    if (videoUrl) { priority += 1; reasons.push('Vídeo disponível para revisão (+1)'); }
    if (cta) { priority += 1; reasons.push('Chamada para ação disponível (+1)'); }
    candidates.push({
      anuncioId: id, produtoId: productId, anunciante: publisher,
      paginaUrl: safeUrl(snapshot.pageProfileUri),
      bibliotecaUrl: 'https://www.facebook.com/ads/library/?id=' + id,
      titulo: text(snapshot.title) || text(relevantCards[0]?.title) || null,
      texto: body || null, chamadaParaAcao: cta,
      destinoUrl: safeUrl(relevantCards[0]?.linkUrl || snapshot.linkUrl),
      videoUrl, imagemUrl: imageUrl, formato: snapshot.displayFormat || null,
      ativo: typeof record.isActive === 'boolean' ? record.isActive : null,
      plataformas: Array.isArray(record.publisherPlatform) ? record.publisherPlatform : [],
      inicioInformado: startedAt, diasDesdeInicioInformado: age, coletadoEm: collectedAt,
      prioridadeRevisao: priority, motivosPrioridade: reasons,
      desempenho: {vendas: null, lucro: null, roas: null},
      revisaoHumana: 'Conferir produto e mídia; a pontuação não estima desempenho comercial.'
    });
  }
  candidates.sort((a,b) => b.prioridadeRevisao - a.prioridadeRevisao || a.anuncioId.localeCompare(b.anuncioId));
  const publishers = [...new Set(candidates.map(ad => ad.anunciante).filter(Boolean))];
  return {
    versao: 1, produtoId: productId, coletadoEm: collectedAt,
    resumo: {recebidos: records.length, duplicadosPorId: duplicateCount, relevantes: candidates.length, descartados: rejected.length, anunciantesDistintos: publishers.length},
    anunciantes: publishers,
    criterio: 'Prioridade de revisão por correspondência, status, vídeo e CTA; não é ranking de vendas.',
    limiteEvidencia: 'Dias desde o início informado não comprovam veiculação contínua. Métricas de venda e lucro não foram fornecidas.',
    anuncios: candidates, descartados: rejected
  };
}
