import { app } from "@repo/config/app";

const Home = () => (
  <main className="flex flex-1 items-center justify-center">
    <h1 className="text-2xl font-semibold">{app.name}</h1>
  </main>
);

export default Home;
