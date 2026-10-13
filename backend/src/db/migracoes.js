/** Migração local atômica; nunca usa reset para converter dados existentes. */
export function migrarBanco(db, ddl) {
  db.transaction(() => {
    const versao = db.pragma('user_version', { simple: true });
    if (versao > 1) throw new Error('Versão do banco não suportada por esta aplicação.');
    const legado = db.pragma('table_info(carrinho_itens)').some(c => c.name === 'usuario_id');
    if (legado) db.exec('ALTER TABLE carrinho_itens RENAME TO carrinho_itens_legado');
    db.exec(ddl);
    db.prepare(`INSERT INTO carrinhos(usuario_id,nome,principal,criado_em,atualizado_em)
      SELECT u.id, 'Meu carrinho', 1, u.criado_em, u.atualizado_em FROM usuarios u
      WHERE NOT EXISTS(SELECT 1 FROM carrinhos c WHERE c.usuario_id=u.id)`).run();
    if (legado) {
      const antes = db.prepare('SELECT * FROM carrinho_itens_legado ORDER BY id').all();
      db.exec(`INSERT INTO carrinho_itens(id,carrinho_id,codigo_produto,quantidade,adicionado_em)
        SELECT i.id,c.id,i.codigo_produto,i.quantidade,i.adicionado_em
        FROM carrinho_itens_legado i JOIN carrinhos c ON c.usuario_id=i.usuario_id AND c.principal=1`);
      const depois = db.prepare(`SELECT i.id,c.usuario_id,i.codigo_produto,i.quantidade,i.adicionado_em
        FROM carrinho_itens i JOIN carrinhos c ON c.id=i.carrinho_id ORDER BY i.id`).all();
      if (JSON.stringify(antes) !== JSON.stringify(depois)) throw new Error('Migração não preservou os itens.');
      db.exec('DROP TABLE carrinho_itens_legado');
    }
    if (db.pragma('foreign_key_check').length) throw new Error('Integridade do banco inválida.');
    db.pragma('user_version = 1');
  }).immediate();
}
