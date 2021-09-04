## What is BackupCustomCSS
BackUpCustomCSS allows you to backup your custom css

## Can I use this on Powercord
Simple answer no

## Where does it store the backups
In a folder named `BackUpCustomCSS` in your plugins folder

## How is the naming done
The file gets named `BackUpCustomCSS-(<Shorthand Day)> <Shorthand Month> <Date #>-<Year #>-<Hour #>-<Minute #>-<Second #>-<Milliseconds #>).css` 
* Example: `BackupCustomCSS-(Fri Sep 03-2021-16-54-28-115).css`

## How is the file content's done
```css
/*
    Backup data
    time: <Shorthand Day)> <Shorthand Month> <Date #> <Year #> <Hour #> <Minute #> <Second #> <Milliseconds #> <gmt / Greenwich Mean Time> <Time zone>
    UnixTimestamp: <UnixTimestamp>
*/
<Your custom CSS>
```
ex: 
```css
/*
    Backup data
    time: Fri Sep 03 2021 16:54:28 GMT-0700 (Pacific Daylight Time)
    UnixTimestamp: 1630713268115
*/

.app-2rEoOp {
    transform: unset !important;
}
```

## Keybinds and Clicking
* Clicking the backup icon will backup the css
* Holding `Shift` and clicking the backup icon will open the settings modal
* Holding `Crtl` and clicking the backup icon will open the file location
* Holding `Alt` and clicking the backup icon will open the delete all backups modal
