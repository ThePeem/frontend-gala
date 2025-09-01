// app/register/page.tsx
import RegisterForm from '../../components/RegisterForm'; // Ajusta la ruta si es necesario

// Este es un Server Component por defecto, lo cual está bien ya que solo renderiza el Client Component
const RegisterPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;