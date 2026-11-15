import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import Explore from './pages/Explore';
import Friends from './pages/Friends';
import GroupPage from './pages/GroupPage';
import Home from './pages/Home';
import JoinGroup from './pages/JoinGroup';
import LogPack from './pages/LogPack';
import NotFound from './pages/NotFound';
import PackPage from './pages/PackPage';
import Profile from './pages/Profile';
import Review from './pages/Review';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/pack/:id" element={<PackPage />} />
        <Route path="/rip" element={<LogPack />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/friends/:id" element={<GroupPage />} />
        <Route path="/join/:code" element={<JoinGroup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/u/:id" element={<Profile />} />
        <Route path="/review" element={<Review />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
