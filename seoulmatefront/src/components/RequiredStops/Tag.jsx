```javascript
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const TagContainer = styled.div`
  display: inline-block;
  padding: 4px 8px;
  margin: 4px;
  border-radius: 4px;
  background-color: #e0e0e0;
  color: #333;
  font-size: 14px;
`;

const Tag = ({ tagName }) => {
  if (typeof tagName !== 'string' || tagName.trim() === '') {
    return null; // Or render a default/placeholder tag or log a warning
  }

  return (
    <TagContainer>
      {tagName}
    </TagContainer>
  );
};

Tag.propTypes = {
  tagName: PropTypes.string
};

export default Tag;
```