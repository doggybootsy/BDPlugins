/**
 * @name GuildClock
 * @author Doggybootsy
 * @description Adds a clock in the guild's column
 * @version 1
 */

module.exports = class GuildClock{
    start() {
        // Css
        BdApi.injectCSS("GuildClock", '#guildclock{color: var(--text-normal); text-align: center; padding: 6px 0; font-size: 1rem}#guildclock::after{content: " " attr(pm_am);}')
        // Add Attribute
        document.getElementsByClassName('guilds-1SWlCJ')[0].setAttribute('guildclock','');
        // Remove extra guildclock element
        if(document.getElementsByClassName('guilds-1SWlCJ')[0].innerHTML.includes('id="guildclock"')){
            document.getElementById('guildclock').remove()
        }
        // Create Element
        document.querySelector('[guildclock] .tutorialContainer-2sGCg9').insertAdjacentHTML('afterend', '<div id="guildclock"></div>');
        // Time stuff
        function GuildClock_time_stuff(){
            const GuildClock_time = new Date('2012-01-13T11:03');
            const GuildClock_time_Hour = GuildClock_time.getHours() > 12 ? GuildClock_time.getHours() - 12 : GuildClock_time.getHours();
            const GuildClock_time_Minute = (GuildClock_time.getMinutes()<10?'0':'') + GuildClock_time.getMinutes();
            // Insert time
            document.getElementById('guildclock').innerText = GuildClock_time_Hour+':'+GuildClock_time_Minute;
            if(GuildClock_time.getHours() >= 12 ? "PM" : "AM" == 'PM'){
                document.getElementById('guildclock').setAttribute('pm_am','pm')
            } else{
                document.getElementById('guildclock').setAttribute('pm_am','am')
            }
        }
        setInterval(GuildClock_time_stuff, 1000);
    }
    stop() {
        // Remove Attribute
        document.getElementsByClassName('guilds-1SWlCJ')[0].removeAttribute('guildclock');
        // hide Element
        document.getElementById('guildclock').style.display = "none"
        // Remove css
        BdApi.injectCSS("GuildClock", '')
    }
}
