export default function AdminRoot() {
  return null;
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/admin/dashboard",
      permanent: true,
    },
  };
}
