# Configuração do Supabase

O site usa o Supabase para autenticação, banco de dados e fotos. A aplicação usa somente a URL do projeto e a chave pública `anon`; não use uma chave `service_role` no navegador.

## Preparar o projeto

1. No Supabase, abra **SQL Editor** e execute o conteúdo de `supabase/setup.sql`.
2. Em **Authentication → Users**, crie o usuário de Guilherme ou Alice com e-mail e senha. O cadastro público pelo site não fica habilitado.
3. Em **SQL Editor**, autorize o e-mail de login como administrador. Substitua o exemplo pelo e-mail que foi criado no passo anterior:

   ```sql
   insert into public.admin_users (email)
   values (lower('SEU_EMAIL_DE_LOGIN'))
   on conflict (email) do nothing;
   ```

4. Confirme que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas nos Secrets do Replit.
5. O site fica pronto para uso após a configuração das tabelas e do primeiro administrador. Não é criado endereço de entrega; ele deve ser preenchido no painel antes de ser habilitado para convidados.

## Acesso e privacidade

- A lista pública consulta somente presentes com status disponível.
- Presentes comprados ou recebidos continuam no painel e deixam de aparecer para os convidados.
- O endereço é retornado ao público somente depois de ser preenchido e habilitado no painel.
- As políticas RLS permitem alterações apenas para e-mails incluídos em `admin_users`.
- Fotos ficam no bucket público `gift-photos`; somente administradores podem enviar, alterar ou excluir imagens.
- A chave Pix inicial é `guilhenriquesilva10@gmail.com`, conforme informado para o site, e pode ser alterada no painel.

Para conceder acesso a Alice ou a outro administrador, crie o usuário em **Authentication → Users** e adicione o mesmo e-mail à tabela `public.admin_users`. Para revogar o acesso, remova a linha correspondente dessa tabela.
