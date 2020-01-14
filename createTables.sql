CREATE DATABASE IF NOT EXISTS JukeVox;
USE JukeVox;
 
CREATE TABLE IF NOT EXISTS  `UserProfiles` (
  `Id` int UNIQUE PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `Username` varchar(20) UNIQUE,
  `Email` varchar(50) NOT NULL,
  `ProfilePicture` varchar(100),
  `CreatedAt` timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS `UserAccounts` (
  `UserProfileId` int UNIQUE PRIMARY KEY NOT NULL,
  `Email` varchar(50) UNIQUE NOT NULL,
  `Password` varchar(100),
  `EmailConfirmationPin` smallint NOT NULL,
  `EmailConfirmed` boolean DEFAULT false,
  `AccountExpiration` datetime DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS `ProviderAccounts` (
  `UserProfileId` int NOT NULL,
  `Provider` ENUM ('Facebook', 'Google', 'Deezer') NOT NULL,
  `ProviderId` varchar(100) NOT NULL,
  PRIMARY KEY (`UserProfileId`, `Provider`)
);

CREATE TABLE IF NOT EXISTS `Friendships` (
  `RequesterId` int NOT NULL,
  `AddresseeId` int NOT NULL,
  PRIMARY KEY (`RequesterId`, `AddresseeId`)
);

CREATE TABLE IF NOT EXISTS `Events` (
  `Id` int UNIQUE PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `CreatorId` int NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Description` nvarchar(2048),
  `EventPicture` varchar(100),
  `StartDate` datetime NOT NULL,
  `EndDate` datetime NOT NULL,
  `Latitude` float NOT NULL,
  `Longitude` float NOT NULL,
  `StreamerDevice` varchar(100),
  `IsPrivate` boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS `Votes` (
  `TrackId` int NOT NULL,
  `UserId` int NOT NULL,
  `Vote` tinyint NOT NULL,
  PRIMARY KEY (`TrackId`, `UserId`)
);

CREATE TABLE IF NOT EXISTS `TrackHistory` (
  `TrackId` int UNIQUE PRIMARY KEY NOT NULL,
  `EventId` int NOT NULL,
  `PlayedAt` datetime DEFAULT (now())
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
  `AddedAt` datetime NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS `Logs` (
  `Id` int UNIQUE PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `EventType` char(1) NOT NULL,
  `UserId` int,
  `Description` varchar(254),
  `EventDate` datetime NOT NULL
);

CREATE TABLE IF NOT EXISTS `EventGuests` (
  `EventId` int NOT NULL,
  `GuestId` int NOT NULL,
  `HasPlayerControl` boolean DEFAULT false,
  `Status` ENUM ('Going', 'NotGoing', 'Invited') NOT NULL,
  PRIMARY KEY (`EventId`, `GuestId`)
);

ALTER TABLE `UserAccounts` ADD FOREIGN KEY (`UserProfileId`) REFERENCES `UserProfiles` (`Id`);

ALTER TABLE `ProviderAccounts` ADD FOREIGN KEY (`UserProfileId`) REFERENCES `UserProfiles` (`Id`);

ALTER TABLE `Friendships` ADD FOREIGN KEY (`RequesterId`) REFERENCES `UserProfiles` (`Id`);

ALTER TABLE `Friendships` ADD FOREIGN KEY (`AddresseeId`) REFERENCES `UserProfiles` (`Id`);

ALTER TABLE `Events` ADD FOREIGN KEY (`CreatorId`) REFERENCES `UserProfiles` (`Id`);

ALTER TABLE `Votes` ADD FOREIGN KEY (`TrackId`) REFERENCES `Tracks` (`Id`);

ALTER TABLE `Votes` ADD FOREIGN KEY (`UserId`) REFERENCES `UserProfiles` (`Id`);

ALTER TABLE `TrackHistory` ADD FOREIGN KEY (`TrackId`) REFERENCES `Tracks` (`Id`);

ALTER TABLE `TrackHistory` ADD FOREIGN KEY (`EventId`) REFERENCES `Events` (`Id`);

ALTER TABLE `Tracks` ADD FOREIGN KEY (`EventId`) REFERENCES `Events` (`Id`);

ALTER TABLE `Tracks` ADD FOREIGN KEY (`UserId`) REFERENCES `UserProfiles` (`Id`);

ALTER TABLE `Logs` ADD FOREIGN KEY (`UserId`) REFERENCES `UserProfiles` (`Id`);

ALTER TABLE `EventGuests` ADD FOREIGN KEY (`EventId`) REFERENCES `Events` (`Id`);

ALTER TABLE `EventGuests` ADD FOREIGN KEY (`GuestId`) REFERENCES `UserProfiles` (`Id`);
