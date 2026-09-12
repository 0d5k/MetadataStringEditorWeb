import { Toolbar } from './components/Toolbar';
import { SearchBar } from './components/SearchBar';
import { StringTable } from './components/StringTable';
import { StatusBar } from './components/StatusBar';
import { useState } from 'react';
import { Credits } from './components/Credits';
import { useMetadataEditor } from './lib/useMetadataEditor';

function App() {
  const [showCredits, setShowCredits] = useState(false);

  const {
    parsed,
    status,
    search,
    setSearch,
    loadFile,
    editEntry,
    revertEntry,
    revertAll,
    saveFile,
    exportTxt,
    exportCsv,
    modifiedCount,
    filteredEntries,
  } = useMetadataEditor();

  return (
    <div className="flex h-full flex-col bg-white text-gray-900">
      <Toolbar
        hasFile={!!parsed}
        hasChanges={modifiedCount > 0}
        onOpenFile={loadFile}
        onSave={saveFile}
        onRevertAll={revertAll}
        onExportTxt={exportTxt}
        onExportCsv={exportCsv}
        onCredits={() => setShowCredits(true)}
      />
      {showCredits ? (
        <Credits onBack={() => setShowCredits(false)} />
      ) : (
        <>
      <SearchBar value={search} onChange={setSearch} disabled={!parsed} />
      <StringTable entries={filteredEntries} onEdit={editEntry} onRevert={revertEntry} />
      <StatusBar
        fileName={parsed?.fileName ?? null}
        totalStrings={parsed?.entries.length ?? 0}
        version={parsed?.header.version ?? null}
        modifiedCount={modifiedCount}
        status={status}
      />
        </>
      )}
    </div>
  );
}

export default App;
