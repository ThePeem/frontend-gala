// src/app/login/page.tsx
import LoginForm from '../../components/LoginForm'; // Ajusta la ruta si es necesario

// Este es un Server Component por defecto, lo cual está bien ya que solo renderiza el Client Component
const LoginPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <LoginForm />
    </div>
  );
};

export default LoginPage;