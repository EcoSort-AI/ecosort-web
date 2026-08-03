import session from "models/session.js";
import user from "models/user.js";

export default function ProfileRedirect() {
  return null;
}

export async function getServerSideProps(context) {
  const sessionToken = context.req.cookies.session_id;
  if (!sessionToken)
    return { redirect: { destination: "/login", permanent: false } };

  try {
    const sessionObject = await session.findOneValidByToken(sessionToken);
    const userObject = await user.findOneById(sessionObject.user_id);

    return {
      redirect: {
        destination: `/admin/users/${userObject.username}`,
        permanent: false,
      },
    };
  } catch (error) {
    console.error(error);
    return { redirect: { destination: "/login", permanent: false } };
  }
}
