CREATE DATABASE IF NOT EXISTS JukeVoxTest;
USE JukeVoxTest;
 
CREATE TABLE IF NOT EXISTS  `UserProfiles` (
  `Id` int UNIQUE PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `Username` varchar(20) UNIQUE,
  `Email` varchar(50),
  `ProfilePicture` varchar(100),
  `CreatedAt` timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS `UserAccounts` (
  `UserProfileId` int UNIQUE PRIMARY KEY NOT NULL,
  `Email` varchar(50) UNIQUE NOT NULL,
  `Password` varchar(100),
  `ConfirmationToken` char(48) UNIQUE,
  `EmailConfirmed` boolean DEFAULT false,
  `TokenExpiration` datetime,
  FOREIGN KEY (`UserProfileId`) REFERENCES `UserProfiles` (`Id`)
);

CREATE TABLE IF NOT EXISTS `ProviderAccounts` (
  `UserProfileId` int NOT NULL,
  `Provider` ENUM ('Facebook', 'Google', 'Deezer') NOT NULL,
  `AccessToken` varchar(100),
  `ProviderId` varchar(100) NOT NULL,
  PRIMARY KEY (`UserProfileId`, `Provider`),
  FOREIGN KEY (`UserProfileId`) REFERENCES `UserProfiles` (`Id`)
);

CREATE TABLE IF NOT EXISTS `Friendships` (
  `RequesterId` int NOT NULL,
  `AddresseeId` int NOT NULL,
  PRIMARY KEY (`RequesterId`, `AddresseeId`),
  FOREIGN KEY (`RequesterId`) REFERENCES `UserProfiles` (`Id`),
  FOREIGN KEY (`AddresseeId`) REFERENCES `UserProfiles` (`Id`)
);

CREATE TABLE IF NOT EXISTS `Events` (
  `Id` int UNIQUE PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `CreatorId` int NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Description` nvarchar(2048),
  `EventPicture` varchar(100),
  `StartDate` datetime NOT NULL,
  `EndDate` datetime NOT NULL,
  `Location` varchar(100) NOT NULL,
  `Latitude` float NOT NULL,
  `Longitude` float NOT NULL,
  `StreamerDevice` varchar(100),
  `IsPrivate` boolean DEFAULT true,
  `RestrictVotingToEventHours` boolean DEFAULT true,
  FOREIGN KEY (`CreatorId`) REFERENCES `UserProfiles` (`Id`)
);

CREATE TABLE IF NOT EXISTS `Tracks` (
  `Id` int UNIQUE PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `EventId` int NOT NULL,
  `UserId` int NOT NULL,
  `DeezerSongId` int NOT NULL,
  `Title` varchar(100) NOT NULL,
  `Duration` int NOT NULL,
  `ArtistName` varchar(100) NOT NULL,
  `PictureSmall` varchar(150),
  `PictureBig` varchar(150),
  `AddedAt` datetime NOT NULL,
  FOREIGN KEY (`EventId`) REFERENCES `Events` (`Id`),
  FOREIGN KEY (`UserId`) REFERENCES `UserProfiles` (`Id`)
);

CREATE TABLE IF NOT EXISTS `Votes` (
  `TrackId` int NOT NULL,
  `UserId` int NOT NULL,
  `Vote` tinyint NOT NULL,
  PRIMARY KEY (`TrackId`, `UserId`),
  FOREIGN KEY (`TrackId`) REFERENCES `Tracks` (`Id`) ON DELETE CASCADE,
  FOREIGN KEY (`UserId`) REFERENCES `UserProfiles` (`Id`)
);

CREATE TABLE IF NOT EXISTS `TrackHistory` (
  `TrackId` int UNIQUE PRIMARY KEY NOT NULL,
  `EventId` int NOT NULL,
  `PlayedAt` timestamp NOT NULL,
  FOREIGN KEY (`TrackId`) REFERENCES `Tracks` (`Id`),
  FOREIGN KEY (`EventId`) REFERENCES `Events` (`Id`)
);

CREATE TABLE IF NOT EXISTS `Logs` (
  `Id` int UNIQUE PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `EventType` char(1) NOT NULL,
  `UserId` int,
  `Description` varchar(254),
  `EventDate` datetime NOT NULL,
  FOREIGN KEY (`UserId`) REFERENCES `UserProfiles` (`Id`)
);

CREATE TABLE IF NOT EXISTS `EventGuests` (
  `EventId` int NOT NULL,
  `GuestId` int NOT NULL,
  `HasPlayerControl` boolean DEFAULT false,
  `GuestStatus` ENUM ('Going', 'NotGoing', 'Invited') NOT NULL,
  PRIMARY KEY (`EventId`, `GuestId`),
  FOREIGN KEY (`EventId`) REFERENCES `Events` (`Id`),
  FOREIGN KEY (`GuestId`) REFERENCES `UserProfiles` (`Id`)
);