/**
 * ============================================================
 *  CADERNETA ESCOLAR DIGITAL — AuthService.gs
 *  Serviço de autenticação simulada
 * ============================================================
 *  Gere utilizadores, autenticação e permissões.
 *  Em produção, substituir por OAuth / Firebase Auth.
 * ============================================================
 */

/**
 * Mapeia o nome do perfil na folha de cálculo para a role interna.
 * @param {string} roleStr O texto vindo da folha
 * @return {string} A role interna ('admin', 'direcao', 'professor')
 */
function _mapRole(roleStr) {
  const s = String(roleStr).toLowerCase();
  if (s.includes('admin')) return 'admin';
  if (s.includes('direct') || s.includes('diret')) return 'direcao';
  return 'professor'; // Default
}

/**
 * Mapa de permissões por papel.
 * Cada acção indica os papéis autorizados.
 * @const {Object<string, string[]>}
 */
const PERMISSIONS = {
  'view_dashboard':    ['professor', 'direcao', 'admin'],
  'view_students':     ['professor', 'direcao', 'admin'],
  'view_grades':       ['professor', 'direcao', 'admin'],
  'edit_grades':       ['professor', 'admin'],
  'edit_behavior':     ['professor', 'admin'],
  'generate_pauta':    ['professor', 'direcao', 'admin'],
  'generate_boletim':  ['professor', 'direcao', 'admin'],
  'generate_pdf':      ['professor', 'direcao', 'admin'],
  'manage_drive':      ['direcao', 'admin'],
  'delete_pdf':        ['admin'],
  'manage_users':      ['admin']
};

// ---------------------------------------------------------------------------
//  Autenticação
// ---------------------------------------------------------------------------

function authenticate(username, password) {
  try {
    if (!username || !password) {
      return {
        success: false,
        message: 'Nome de utilizador e palavra-passe são obrigatórios.'
      };
    }

    const normalizedUser = String(username).trim().toLowerCase();
    const normalizedPass = String(password).trim();

    const users = getUsers(); // Read from DataService
    let user = users.find(
      u => u.username.toLowerCase() === normalizedUser && u.password === normalizedPass
    );

    // Fallback para contas de teste
    if (!user) {
      const testUsers = [
        { username: 'admin', password: 'admin2026', nome: 'admin', roleStr: 'Administrador(a)' },
        { username: 'diretor', password: 'dir2026', nome: 'diretor', roleStr: 'Director(a)' },
        { username: 'professor', password: 'prof2026', nome: 'professor', roleStr: 'Professor(a)' },
        { username: 'pramim', password: 'prof2026', nome: 'Pascoa Ramim', roleStr: 'Professor(a)' }
      ];
      user = testUsers.find(
        u => u.username === normalizedUser && u.password === normalizedPass
      );
    }

    if (!user) {
      Logger.log('Tentativa de login falhada para: ' + normalizedUser);
      return {
        success: false,
        message: 'Credenciais inválidas'
      };
    }

    const role = _mapRole(user.roleStr);
    Logger.log('Login bem-sucedido: ' + user.nome + ' (' + role + ')');

    return {
      success: true,
      user: {
        username: user.username,
        nome: user.nome,
        role: role,
        avatar: _getInitials(user.nome),
        permissions: _getUserPermissions(role)
      }
    };
  } catch (erro) {
    Logger.log('Erro na autenticação: ' + erro.message);
    return {
      success: false,
      message: 'Nao foi possivel validar as credenciais. Contacte o administrador do sistema.'
    };
  }
}

/**
 * Autentica um utilizador via Google OAuth pelo seu email.
 *
 * @param {string} email  Email do utilizador vindo do token Google.
 * @return {Object}  { success: boolean, user?: Object, message?: string }
 */
function authenticateWithGoogle(email) {
  try {
    if (!email) {
      return { success: false, message: 'Email não fornecido pelo Google.' };
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const users = getUsers();
    
    const user = users.find(u => u.email && u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      Logger.log('Utilizador não encontrado via Google Login: ' + normalizedEmail);
      return {
        success: false,
        message: 'Este email não está autorizado no sistema. Contacte a direção.'
      };
    }

    const role = _mapRole(user.roleStr);
    Logger.log('Login Google bem-sucedido: ' + user.nome + ' (' + role + ')');

    return {
      success: true,
      user: {
        username: user.username,
        nome: user.nome,
        role: role,
        avatar: _getInitials(user.nome),
        permissions: _getUserPermissions(role)
      }
    };
  } catch (erro) {
    Logger.log('Erro na autenticação Google: ' + erro.message);
    return {
      success: false,
      message: 'Nao foi possivel validar o acesso Google. Contacte o administrador do sistema.'
    };
  }
}

// ---------------------------------------------------------------------------
//  Perfil do utilizador
// ---------------------------------------------------------------------------

function getUserProfile(username) {
  try {
    if (!username) return null;

    const users = getUsers();
    const user = users.find(
      u => u.username.toLowerCase() === String(username).trim().toLowerCase()
    );

    if (!user) return null;

    const role = _mapRole(user.roleStr);

    return {
      username: user.username,
      nome: user.nome,
      role: role,
      avatar: _getInitials(user.nome),
      roleLabel: _getRoleLabel(role),
      permissions: _getUserPermissions(role)
    };
  } catch (erro) {
    Logger.log('Erro ao obter perfil: ' + erro.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
//  Verificação de permissões
// ---------------------------------------------------------------------------

/**
 * Verifica se um papel tem permissão para executar uma acção.
 *
 * @param {string} role    Papel do utilizador (professor, direcao, admin).
 * @param {string} action  Nome da acção a verificar.
 * @return {boolean}  true se permitido.
 */
function checkPermission(role, action) {
  try {
    if (!role || !action) return false;
    if (role === 'admin') return true; // admin tem acesso total

    const allowedRoles = PERMISSIONS[action];
    if (!allowedRoles) {
      Logger.log('Acção desconhecida para verificação de permissão: ' + action);
      return false;
    }

    return allowedRoles.includes(role);
  } catch (erro) {
    Logger.log('Erro ao verificar permissão: ' + erro.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
//  Funções auxiliares (privadas)
// ---------------------------------------------------------------------------

/**
 * Extrai as iniciais de um nome completo (máx. 2 letras).
 *
 * @param {string} nome  Nome completo.
 * @return {string}  Iniciais em maiúsculas.
 * @private
 */
function _getInitials(nome) {
  if (!nome) return '??';
  const partes = String(nome).trim().split(/\s+/);
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

/**
 * Devolve a etiqueta legível de um papel.
 *
 * @param {string} role  Código do papel.
 * @return {string}  Etiqueta traduzida.
 * @private
 */
function _getRoleLabel(role) {
  const labels = {
    professor: 'Professor(a)',
    direcao: 'Direcção',
    admin: 'Administrador'
  };
  return labels[role] || role;
}

/**
 * Devolve a lista de permissões de um papel.
 *
 * @param {string} role  Código do papel.
 * @return {string[]}  Lista de acções permitidas.
 * @private
 */
function _getUserPermissions(role) {
  if (role === 'admin') return Object.keys(PERMISSIONS);

  return Object.entries(PERMISSIONS)
    .filter(([, roles]) => roles.includes(role))
    .map(([action]) => action);
}
