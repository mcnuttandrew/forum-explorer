import React from 'react';

export default function SearchBox({setSearch, searchValue}) {
  return (
    <div className="flex">
      {searchValue && (
        <div className="search-clear" onClick={() => setSearch('')}>
          X
        </div>
      )}
      <div>
        {searchValue === '' && (
          <div className="absolute no-pointer">Search</div>
        )}
        <input
          className="search-bar"
          onChange={d => setSearch(d.target.value)}
          value={searchValue}
        />
      </div>
    </div>
  );
}
