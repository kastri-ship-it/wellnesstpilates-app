# Assets Directory

This directory contains all image assets for the WellNest Pilates booking application.

## Structure

```
src/assets/
├── images.ts          # Central image asset exports
└── README.md          # This file
```

## Image Assets

All original Figma images are centralized here:

### Logo
- **logo**: WellNest Pilates studio logo
- Used in: All components (header/footer)

### Instructor Photos
- **rinaInstructorPhoto**: Photo of Rina Krasniqi for booking screen
- **rinaProfilePhoto**: Photo of Rina Krasniqi for instructor profile
- Used in: BookingScreen, InstructorProfile

### Training Type Images
- **multiPackageImage**: Group Pilates class packages
- **singleSessionImage**: Single session booking
- **individualTrainingImage**: Individual/private training
- **duoTrainingImage**: Duo/partner training

## Usage

Import images from the centralized file using relative paths:

```typescript
// From components folder (need to go up 2 folders)
import { logo, rinaInstructorPhoto } from '../../assets/images';
```

Then use in components:

```tsx
<img src={logo} alt="WellNest Pilates Logo" className="w-12 h-12" />
```

## File Organization

- **Components location**: `/src/app/components/`
- **Assets location**: `/src/assets/`
- **Relative path from components**: `../../assets/images`

All components now import from the centralized assets file, making it easy to manage and update images across the entire application.
