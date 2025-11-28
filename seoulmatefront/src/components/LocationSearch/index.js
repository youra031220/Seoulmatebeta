```javascript
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { debounce } from 'lodash';

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
`;

const SearchResults = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: #fff;
  border: 1px solid #ccc;
  border-top: none;
  border-radius: 0 0 5px 5px;
  list-style: none;
  padding: 0;
  margin: 0;
  z-index: 1;
  display: ${(props) => (props.visible ? 'block' : 'none')};
`;

const SearchResultItem = styled.li`
  padding: 10px;
  cursor: pointer;
  &:hover {
    background-color: #f0f0f0;
  }
`;

const LocationSearch = ({ onSelectLocation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const searchInputRef = useRef(null);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setIsResultsVisible(!!value); // Show/hide results based on input value
    debouncedSearch(value);
  };

  const searchLocations = async (searchTerm) => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/locations?query=${searchTerm}`); // Assuming an API endpoint
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (Array.isArray(data)) {
        setSearchResults(data);
      } else {
        setSearchResults([]); // Handle cases where the API returns non-array data
      }
    } catch (error) {
      console.error("Could not fetch locations:", error);
      setSearchResults([]); // Ensure searchResults is always an array, even on error
    }
  };

  const debouncedSearch = debounce(searchLocations, 300);

  const handleSelectLocation = (location) => {
    setSearchTerm(location.name); // Or whatever property displays the location name
    setSearchResults([]);
    setIsResultsVisible(false);
    if (onSelectLocation && typeof onSelectLocation === 'function') {
      onSelectLocation(location);
    }
  };

  const handleClickOutside = (event) => {
    if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
      setIsResultsVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <SearchContainer ref={searchInputRef}>
      <SearchInput
        type="text"
        placeholder="Search for a location"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setIsResultsVisible(!!searchTerm)} // Show results on focus if there's a search term
      />
      <SearchResults visible={isResultsVisible && searchResults.length > 0}>
        {searchResults.map((location) => (
          <SearchResultItem key={location.id} onClick={() => handleSelectLocation(location)}>
            {location.name}
          </SearchResultItem>
        ))}
      </SearchResults>
    </SearchContainer>
  );
};

export default LocationSearch;
```