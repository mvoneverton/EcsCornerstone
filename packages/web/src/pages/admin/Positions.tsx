import { Routes, Route } from 'react-router-dom';
import PositionList   from './positions/PositionList';
import PositionNew    from './positions/PositionNew';
import PositionDetail from './positions/PositionDetail';

export default function Positions() {
  return (
    <Routes>
      <Route index            element={<PositionList />} />
      <Route path="new"       element={<PositionNew />} />
      <Route path=":id"       element={<PositionDetail />} />
    </Routes>
  );
}
